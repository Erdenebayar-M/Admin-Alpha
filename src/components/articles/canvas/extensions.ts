import { Extension, Node, mergeAttributes, type Extensions } from "@tiptap/core";
import { Heading } from "@tiptap/extension-heading";
import { ListItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion, { exitSuggestion } from "@tiptap/suggestion";
import { DOC_NODE, generateBlockId, type PreservedBlock } from "@/lib/article-body";
import { isAllowedHref } from "@/lib/article-types";
import { filterBlockCommands, type BlockCommand } from "./block-commands";
import { MediaBlockView } from "./MediaBlockView";
import type { MediaDialogStore } from "./media-dialog-store";
import { QuoteView } from "./QuoteView";
import type { SlashMenuStore } from "./slash-menu-store";

/**
 * The canvas's schema: exactly the Block kinds the Article Body can hold
 * (see `lib/article-body.ts` for the node ↔ Block mapping), with inline
 * formatting limited to bold, italic and link. Anything StarterKit ships that
 * the Body can't represent is switched off, so no keystroke, toolbar button
 * or paste can produce content the backend would reject.
 */

const TOP_LEVEL_NODES = [
  DOC_NODE.paragraph,
  DOC_NODE.heading,
  DOC_NODE.bulletList,
  DOC_NODE.orderedList,
  DOC_NODE.quote,
  DOC_NODE.callout,
  DOC_NODE.divider,
  DOC_NODE.preserved,
];

// ── Block ids ─────────────────────────────────────────────────────────────

/**
 * Every top-level node carries its Block's id. A node that has none (new, or
 * split off another — `keepOnSplit: false`) or repeats one (a copy pasted
 * back in) gets a fresh id after each change, so ids stay stable and unique.
 */
const BlockIds = Extension.create({
  name: "blockIds",
  addGlobalAttributes() {
    return [
      {
        types: TOP_LEVEL_NODES,
        attributes: {
          blockId: {
            default: null,
            keepOnSplit: false,
            parseHTML: (el) => el.getAttribute("data-block-id"),
            renderHTML: (attrs) => (attrs.blockId ? { "data-block-id": attrs.blockId } : {}),
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockIds"),
        appendTransaction(transactions, _old, state) {
          if (!transactions.some((t) => t.docChanged)) return null;
          const tr = state.tr;
          const seen = new Set<string>();
          state.doc.forEach((node, offset) => {
            if (!("blockId" in node.attrs)) return;
            let id = node.attrs.blockId as string | null;
            if (!id || seen.has(id)) {
              id = generateBlockId();
              tr.setNodeAttribute(offset, "blockId", id);
            }
            seen.add(id);
          });
          return tr.docChanged ? tr : null;
        },
      }),
    ];
  },
});

// ── Server-side Block errors ──────────────────────────────────────────────

export const blockErrorsKey = new PluginKey<Record<string, string>>("blockErrors");

/** Outlines each Block a save was rejected for and shows the server's message under it. Set via a `blockErrorsKey` meta. */
const BlockErrors = Extension.create({
  name: "blockErrors",
  addProseMirrorPlugins() {
    return [
      new Plugin<Record<string, string>>({
        key: blockErrorsKey,
        state: {
          init: () => ({}),
          apply: (tr, prev) => tr.getMeta(blockErrorsKey) ?? prev,
        },
        props: {
          decorations(state) {
            const errors = blockErrorsKey.getState(state) ?? {};
            if (Object.keys(errors).length === 0) return null;
            const decorations: Decoration[] = [];
            state.doc.forEach((node, offset) => {
              const id = node.attrs.blockId as string | null;
              const message = id ? errors[id] : undefined;
              if (!id || !message) return;
              const end = offset + node.nodeSize;
              decorations.push(
                Decoration.node(offset, end, {
                  class: "rounded-md outline-2 outline-offset-4 outline-destructive",
                  "data-block-error": "",
                }),
                Decoration.widget(
                  end,
                  () => {
                    const el = document.createElement("p");
                    el.contentEditable = "false";
                    el.className = "mt-2 text-xs font-medium text-destructive";
                    el.textContent = message;
                    return el;
                  },
                  { side: -1, key: `${id}:${message}` },
                ),
              );
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

// ── Block nodes ───────────────────────────────────────────────────────────

const Quote = Node.create({
  name: DOC_NODE.quote,
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes() {
    return {
      attribution: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-attribution"),
        renderHTML: (attrs) => (attrs.attribution ? { "data-attribution": attrs.attribution } : {}),
      },
    };
  },
  parseHTML() {
    // A pasted <blockquote><p>…</p></blockquote> is common; read the paragraph's text.
    return [{ tag: "blockquote", contentElement: (el: HTMLElement) => el.querySelector<HTMLElement>("p") ?? el }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["blockquote", HTMLAttributes, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(QuoteView);
  },
});

const Callout = Node.create({
  name: DOC_NODE.callout,
  group: "block",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        class: "my-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3",
      }),
      0,
    ];
  },
});

function preservedLabel(block: PreservedBlock | null): string {
  switch (block?.type) {
    case "image":
      return `Зураг — ${block.alt}`;
    case "video":
      return `Видео — ${block.provider === "youtube" ? "YouTube" : "Vimeo"} (${block.video_id})`;
    case "link_card":
      return `Холбоосын карт — ${block.title}`;
    default:
      return "Блок";
  }
}

/**
 * Image, video and link card Blocks: one atom node carrying the whole Block
 * as an attr, rendered by `MediaBlockView` (a preview + click-to-edit),
 * configured with the `mediaDialog` store that view opens for both editing
 * an existing one and — via `block-commands.ts`'s insert commands — creating
 * a new one, so opening and saving an Article that has them never drops or
 * alters the parts the canvas doesn't render inline.
 */
const PreservedBlockNode = Node.create<{ mediaDialog: MediaDialogStore | null }>({
  name: DOC_NODE.preserved,
  group: "block",
  atom: true,
  selectable: true,
  addOptions() {
    return { mediaDialog: null };
  },
  addStorage() {
    return { mediaDialog: this.options.mediaDialog };
  },
  addAttributes() {
    return {
      block: {
        default: null,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-block") ?? "null");
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) => ({ "data-block": JSON.stringify(attrs.block) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-preserved-block]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-preserved-block": "",
        class: "my-4 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground",
      }),
      preservedLabel(node.attrs.block as PreservedBlock | null),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaBlockView);
  },
});

/** A scheme-less "example.com" or "a@b.mn", as autolink sees a typed word before it adds the scheme. */
function isBareLinkTarget(url: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith("/") && /^[^\s/]+\.[^\s]+$/.test(url);
}

// ── Slash menu ────────────────────────────────────────────────────────────

const slashKey = new PluginKey("slashCommand");

const SlashCommand = Extension.create<{ store: SlashMenuStore | null }>({
  name: "slashCommand",
  addOptions() {
    return { store: null };
  },
  addProseMirrorPlugins() {
    const store = this.options.store;
    return [
      Suggestion<BlockCommand, BlockCommand>({
        editor: this.editor,
        pluginKey: slashKey,
        char: "/",
        items: ({ query }) => filterBlockCommands(query),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.run(editor);
        },
        render: () => {
          const emit = (p: { items: BlockCommand[]; command: (item: BlockCommand) => void; clientRect?: (() => DOMRect | null) | null }) =>
            store?.open({ items: p.items, select: p.command, rect: p.clientRect?.() ?? null });
          return {
            onStart: emit,
            onUpdate: emit,
            onExit: () => store?.close(),
            onKeyDown: ({ event, view }) => {
              if (event.key === "Escape") {
                exitSuggestion(view, slashKey);
                return true;
              }
              return store?.keyDown(event) ?? false;
            },
          };
        },
      }),
    ];
  },
});

// ── Assembly ──────────────────────────────────────────────────────────────

export function articleCanvasExtensions(slashMenu: SlashMenuStore, mediaDialog: MediaDialogStore): Extensions {
  return [
    StarterKit.configure({
      blockquote: false,
      code: false,
      codeBlock: false,
      hardBreak: false,
      heading: false,
      listItem: false,
      strike: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        // Same allowlist as the backend's inlineHrefSchema — a disallowed href never becomes a link.
        // Autolink checks the bare typed word ("example.com", "a@b.mn") before adding https:/mailto:,
        // so a scheme-less domain or email is let through here; linkify gives it the real href.
        isAllowedUri: (url, { defaultValidate }) => isAllowedHref(url) || (isBareLinkTarget(url) && defaultValidate(url)),
      },
    }),
    // Headings hold plain text only (HeadingBlock.text), at levels 2 and 3.
    Heading.extend({ marks: "" }).configure({ levels: [2, 3] }),
    // One level only: a list item is a single paragraph, never another list.
    ListItem.extend({ content: DOC_NODE.paragraph }),
    Quote,
    Callout,
    PreservedBlockNode.configure({ mediaDialog }),
    BlockIds,
    BlockErrors,
    SlashCommand.configure({ store: slashMenu }),
    Placeholder.configure({ placeholder: "Бичиж эхлэх, эсвэл «/» дарж блок нэмэх…" }),
  ];
}
