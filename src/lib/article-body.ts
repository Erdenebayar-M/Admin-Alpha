import type { JSONContent } from "@tiptap/core";
import {
  isAllowedHref,
  isColorValue,
  type ArticleBlock,
  type ColorValue,
  type ImageBlock,
  type InlineSpan,
  type LinkCardBlock,
  type VideoBlock,
} from "./article-types";

/**
 * Converter between the Article Body (the backend's Block array, ADR 0001)
 * and the Tiptap document the canvas edits. Pure — no DOM, no editor
 * instance — so it's the seam the Body's fidelity is tested at.
 *
 * Every top-level node carries its Block's id in a `blockId` attr, so ids
 * survive editing and a server error naming a Block can be traced back to the
 * node it came from. Adding a Block kind means one case in each direction.
 */

export type TiptapDocument = JSONContent & { type: "doc" };

/** Node/mark names shared with the canvas's Tiptap extensions. */
export const DOC_NODE = {
  paragraph: "paragraph",
  heading: "heading",
  bulletList: "bulletList",
  orderedList: "orderedList",
  listItem: "listItem",
  quote: "quote",
  callout: "callout",
  divider: "horizontalRule",
  preserved: "preservedBlock",
  text: "text",
} as const;

export const DOC_MARK = { bold: "bold", italic: "italic", link: "link", color: "textColor", highlight: "highlightColor" } as const;

/** Node types (paragraph, heading, list, quote, callout) whose Block kind can carry a `background`. */
export const BACKGROUND_NODES = [
  DOC_NODE.paragraph,
  DOC_NODE.heading,
  DOC_NODE.bulletList,
  DOC_NODE.orderedList,
  DOC_NODE.quote,
  DOC_NODE.callout,
] as const;

/**
 * Image, video and link card Blocks — modeled as one atom node carrying the
 * whole Block as an attr (see `MediaBlockView`/`media-dialog-store.ts` for
 * how the canvas renders and edits them), so the round trip below never has
 * to know their internal shape.
 */
export type PreservedBlock = ImageBlock | VideoBlock | LinkCardBlock;

// ── Blocks → document ───────────────────────────────────────────────────

function spansToNodes(spans: InlineSpan[]): JSONContent[] | undefined {
  const nodes = spans
    .filter((span) => span.text.length > 0)
    .map((span): JSONContent => {
      const marks: JSONContent["marks"] = [];
      if (span.bold) marks.push({ type: DOC_MARK.bold });
      if (span.italic) marks.push({ type: DOC_MARK.italic });
      if (span.href) marks.push({ type: DOC_MARK.link, attrs: { href: span.href } });
      // A link is never coloured (schema rule) — a stored Body should never have both, but
      // href wins if it somehow does, same as the backend's own precedence.
      if (!span.href) {
        if (span.color) marks.push({ type: DOC_MARK.color, attrs: { color: span.color } });
        else if (span.highlight) marks.push({ type: DOC_MARK.highlight, attrs: { color: span.highlight } });
      }
      return { type: DOC_NODE.text, text: span.text, ...(marks.length ? { marks } : {}) };
    });
  return nodes.length ? nodes : undefined;
}

function backgroundAttrs(background: ColorValue | undefined): { background: ColorValue | null } {
  return { background: background ?? null };
}

function withContent(node: JSONContent, content: JSONContent[] | undefined): JSONContent {
  return content ? { ...node, content } : node;
}

function blockToNode(block: ArticleBlock): JSONContent {
  const blockId = block.id;
  switch (block.type) {
    case "paragraph":
      return withContent(
        { type: DOC_NODE.paragraph, attrs: { blockId, ...backgroundAttrs(block.background) } },
        spansToNodes(block.content),
      );
    case "heading":
      return withContent(
        { type: DOC_NODE.heading, attrs: { blockId, level: block.level, color: block.color ?? null, ...backgroundAttrs(block.background) } },
        spansToNodes([{ text: block.text }]),
      );
    case "list":
      return {
        type: block.style === "ordered" ? DOC_NODE.orderedList : DOC_NODE.bulletList,
        attrs: { blockId, ...backgroundAttrs(block.background) },
        content: block.items.map((item) => ({
          type: DOC_NODE.listItem,
          content: [withContent({ type: DOC_NODE.paragraph }, spansToNodes(item))],
        })),
      };
    case "quote":
      return withContent(
        { type: DOC_NODE.quote, attrs: { blockId, attribution: block.attribution ?? null, ...backgroundAttrs(block.background) } },
        spansToNodes(block.content),
      );
    case "callout":
      return withContent(
        { type: DOC_NODE.callout, attrs: { blockId, ...backgroundAttrs(block.background) } },
        spansToNodes(block.content),
      );
    case "divider":
      return { type: DOC_NODE.divider, attrs: { blockId } };
    case "image":
    case "video":
    case "link_card":
      return { type: DOC_NODE.preserved, attrs: { blockId, block } };
  }
}

export function blocksToDoc(blocks: ArticleBlock[]): TiptapDocument {
  const content = blocks.map(blockToNode);
  return { type: "doc", content: content.length ? content : [{ type: DOC_NODE.paragraph, attrs: { blockId: null } }] };
}

// ── Document → blocks ───────────────────────────────────────────────────

function hasMark(node: JSONContent, type: string) {
  return !!node.marks?.some((m) => m.type === type);
}

function nodeToSpan(node: JSONContent): InlineSpan | null {
  if (node.type !== DOC_NODE.text || !node.text) return null;
  const span: InlineSpan = { text: node.text };
  if (hasMark(node, DOC_MARK.bold)) span.bold = true;
  if (hasMark(node, DOC_MARK.italic)) span.italic = true;
  const href = node.marks?.find((m) => m.type === DOC_MARK.link)?.attrs?.href;
  if (typeof href === "string" && isAllowedHref(href)) span.href = href;
  // A link is never coloured (schema rule): only look for color/highlight when there's no
  // href, and take at most one of them even if the doc somehow carries both marks.
  if (!span.href) {
    const color = node.marks?.find((m) => m.type === DOC_MARK.color)?.attrs?.color;
    const highlight = node.marks?.find((m) => m.type === DOC_MARK.highlight)?.attrs?.color;
    if (isColorValue(color)) span.color = color;
    else if (isColorValue(highlight)) span.highlight = highlight;
  }
  return span;
}

const sameFormat = (a: InlineSpan, b: InlineSpan) =>
  a.bold === b.bold && a.italic === b.italic && a.href === b.href && a.color === b.color && a.highlight === b.highlight;

/** Inline spans of a textblock, adjacent same-format text merged; `null` when there's no visible text. */
function nodeToSpans(node: JSONContent): InlineSpan[] | null {
  const spans: InlineSpan[] = [];
  for (const child of node.content ?? []) {
    const span = nodeToSpan(child);
    if (!span) continue;
    const last = spans[spans.length - 1];
    if (last && sameFormat(last, span)) last.text += span.text;
    else spans.push(span);
  }
  return spans.some((s) => s.text.trim()) ? spans : null;
}

const plainText = (spans: InlineSpan[]) => spans.map((s) => s.text).join("");

function listItems(list: JSONContent): InlineSpan[][] {
  const items: InlineSpan[][] = [];
  for (const item of list.content ?? []) {
    const paragraph = item.content?.find((c) => c.type === DOC_NODE.paragraph);
    const spans = paragraph && nodeToSpans(paragraph);
    if (spans) items.push(spans);
  }
  return items;
}

type BlockWithoutId = ArticleBlock extends infer B ? (B extends ArticleBlock ? Omit<B, "id"> : never) : never;

/** `{ background }` when the node's `background` attr is a valid Colour, else `{}` — spread onto the Block. */
function backgroundFromNode(node: JSONContent): { background?: ColorValue } {
  const background = node.attrs?.background;
  return isColorValue(background) ? { background } : {};
}

/** The Block a top-level node stands for, or `null` when it's empty and must not be sent. */
function nodeToBlock(node: JSONContent): BlockWithoutId | null {
  switch (node.type) {
    case DOC_NODE.paragraph: {
      const content = nodeToSpans(node);
      return content && { type: "paragraph", content, ...backgroundFromNode(node) };
    }
    case DOC_NODE.heading: {
      const spans = nodeToSpans(node);
      if (!spans) return null;
      const color = node.attrs?.color;
      return {
        type: "heading",
        level: node.attrs?.level === 3 ? 3 : 2,
        text: plainText(spans),
        ...(isColorValue(color) ? { color } : {}),
        ...backgroundFromNode(node),
      };
    }
    case DOC_NODE.bulletList:
    case DOC_NODE.orderedList: {
      const items = listItems(node);
      if (!items.length) return null;
      return { type: "list", style: node.type === DOC_NODE.orderedList ? "ordered" : "bullet", items, ...backgroundFromNode(node) };
    }
    case DOC_NODE.quote: {
      const content = nodeToSpans(node);
      if (!content) return null;
      const raw = node.attrs?.attribution;
      const attribution = typeof raw === "string" ? raw.trim() : "";
      return { type: "quote", content, ...(attribution ? { attribution } : {}), ...backgroundFromNode(node) };
    }
    case DOC_NODE.callout: {
      const content = nodeToSpans(node);
      return content && { type: "callout", content, ...backgroundFromNode(node) };
    }
    case DOC_NODE.divider:
      return { type: "divider" };
    case DOC_NODE.preserved: {
      const block = node.attrs?.block as PreservedBlock | undefined;
      if (!block) return null;
      const rest: Partial<PreservedBlock> = { ...block };
      delete rest.id;
      return rest as BlockWithoutId;
    }
    default:
      return null;
  }
}

/** Short random id for a new Block. Works outside secure contexts, unlike `crypto.randomUUID`. */
export function generateBlockId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The Block array to save. Empty blocks are dropped (the schema requires
 * non-empty content), and a node with no id or a repeated one gets a fresh
 * id, since the backend rejects duplicate Block ids.
 */
export function docToBlocks(doc: TiptapDocument, newId: () => string = generateBlockId): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const seen = new Set<string>();
  for (const node of doc.content ?? []) {
    const block = nodeToBlock(node);
    if (!block) continue;
    const attrId = node.attrs?.blockId;
    const id = typeof attrId === "string" && attrId && !seen.has(attrId) ? attrId : newId();
    seen.add(id);
    blocks.push({ id, ...block } as ArticleBlock);
  }
  return blocks;
}
