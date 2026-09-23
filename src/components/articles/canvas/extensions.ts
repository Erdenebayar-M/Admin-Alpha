import { Extension, Mark, Node, mergeAttributes, type Extensions } from "@tiptap/core";
import { Heading } from "@tiptap/extension-heading";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extensions";
import { liftListItem } from "@tiptap/pm/schema-list";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion, { exitSuggestion, type SuggestionProps } from "@tiptap/suggestion";
import { shift, size } from "@floating-ui/dom";
import { colorCss, tintCss } from "@/lib/article-colors";
import { BACKGROUND_NODES, DOC_MARK, DOC_NODE, generateBlockId, type PreservedBlock } from "@/lib/article-body";
import { isAllowedHref, isColorValue } from "@/lib/article-types";
import { filterBlockCommands, type BlockCommand } from "./block-commands";
import { COLOR_MENU_STORAGE_KEY, type ColorMenuStore } from "./color/color-menu-store";
import { ListMarkerView } from "./ListMarkerView";
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

// ── Colours (Admin-Alpha#9) ──────────────────────────────────────────────
// Text colour and highlight are marks on inline text; a whole-Block
// background is a node attr on the Block kinds that can carry one
// (`BACKGROUND_NODES`, mirroring `article-body.ts`'s Block <-> node mapping).
// A subheading's colour is a node attr too (`HeadingBlock.color` applies to
// the whole heading, not a run of words), added directly on the Heading
// extension below rather than through a mark.

/** A `{ [attrName]: ColorValue }` attribute rendered as both a `data-*` marker (round-trippable via `parseHTML`) and an inline CSS style. */
function colorAttribute(attrName: string, dataAttr: string, cssProp: "color" | "background-color") {
  return {
    [attrName]: {
      default: null,
      parseHTML: (el: HTMLElement) => el.getAttribute(dataAttr),
      renderHTML: (attrs: Record<string, unknown>) => {
        const value = attrs[attrName];
        if (!isColorValue(value)) return {};
        const css = cssProp === "color" ? colorCss(value) : tintCss(value);
        return { [dataAttr]: value, style: `${cssProp}: ${css}` };
      },
    },
  };
}

const TextColorMark = Mark.create({
  name: DOC_MARK.color,
  addAttributes() {
    return colorAttribute("color", "data-color", "color");
  },
  parseHTML() {
    return [{ tag: "span[data-color]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

const HighlightMark = Mark.create({
  name: DOC_MARK.highlight,
  addAttributes() {
    return colorAttribute("color", "data-highlight", "background-color");
  },
  parseHTML() {
    return [{ tag: "span[data-highlight]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

/** Global `background` attr on every Block kind that can carry one (paragraph, heading, list, quote, callout). */
const BlockBackground = Extension.create({
  name: "blockBackground",
  addGlobalAttributes() {
    return [
      {
        types: [...BACKGROUND_NODES],
        attributes: colorAttribute("background", "data-background", "background-color"),
      },
    ];
  },
});

// ── Text alignment (Admin-Alpha#10) ─────────────────────────────────────────
// Scoped identically to `background` (ADR 0004): the same five Block kinds
// carry it. Unlike `background`, this isn't a global attribute across those
// types — each node adds it individually via `addAttributes()`, the same way
// Quote already carries `attribution`, so divider/image/video/link_card never
// gain it even by accident.

/** A `data-alignment` attribute rendered as both a round-trippable marker and a `text-align` style. `center`/`right` only — left is never written (ADR 0004). */
function alignmentAttribute() {
  return {
    alignment: {
      default: null,
      parseHTML: (el: HTMLElement) => el.getAttribute("data-alignment"),
      renderHTML: (attrs: Record<string, unknown>) => {
        const value = attrs.alignment;
        if (value !== "center" && value !== "right") return {};
        return { "data-alignment": value, style: `text-align: ${value}` };
      },
    },
  };
}

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
      ...alignmentAttribute(),
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
  addAttributes() {
    return { ...alignmentAttribute() };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const background = node.attrs.background;
    const borderAttrs = isColorValue(background) ? { style: `border-color: ${colorCss(background)}` } : {};
    return [
      "aside",
      mergeAttributes(
        HTMLAttributes,
        {
          "data-callout": "",
          class: "my-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3",
        },
        borderAttrs,
      ),
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

// ── List markers (ADR 0005) ──────────────────────────────────────────────
// The bullet/number at the start of a list item's line, previously the
// browser's native `::marker` — CSS, not part of the document, so it could
// never be selected or coloured, and `alignment`'s `text-align` (set on the
// list node) never moved it. Replaced with a real, atomic, inline node: the
// first child of every list item's paragraph, colourable via the same
// `colorAttribute()` pattern as everything else, whose glyph/number
// `ListMarkerView` computes from its own position, never stored.

/**
 * A List item's Marker: read-only text (`ListMarkerView` computes the
 * glyph), but its `color` is an ordinary author-editable attribute — mirrors
 * `Heading`'s node-attr colour (one indivisible unit, not a run of text) more
 * than a mark, since `atom: true` is what makes it a single, unsplittable
 * selection in the first place; a mark could straddle only part of it.
 */
const ListMarker = Node.create({
  name: DOC_NODE.listMarker,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  marks: "",
  addAttributes() {
    return { ...colorAttribute("color", "data-marker-color", "color") };
  },
  parseHTML() {
    return [{ tag: "span[data-list-marker]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-list-marker": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ListMarkerView);
  },
});

/**
 * Guarantees a `listMarker` is always the first child of a list item's
 * paragraph, and only there — inserting one (uncoloured) whenever a list
 * item's paragraph is missing it, and removing one from any paragraph that
 * *isn't* (any more) a list item's, such as the plain paragraph
 * `ListItemExit` lifts out of a list. Covers every way a listItem can come
 * to exist without a marker: `toggleBulletList`/`toggleOrderedList` (stock
 * Tiptap commands, no marker awareness) and a pasted list (external HTML has
 * no `data-list-marker`) — and doubles as the author's inability to delete
 * the marker itself: a Backspace that removes it gets a fresh one reinserted
 * on the very next transaction.
 */
const ListMarkerIntegrity = Extension.create({
  name: "listMarkerIntegrity",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("listMarkerIntegrity"),
        appendTransaction(transactions, _old, state) {
          if (!transactions.some((t) => t.docChanged)) return null;
          const tr = state.tr;
          let changed = false;
          state.doc.descendants((node, pos, parent) => {
            if (node.type.name !== DOC_NODE.paragraph) return true;
            const inListItem = parent?.type.name === DOC_NODE.listItem;
            const hasMarker = node.firstChild?.type.name === DOC_NODE.listMarker;
            if (inListItem && !hasMarker) {
              const marker = state.schema.nodes[DOC_NODE.listMarker].create({ color: null });
              tr.insert(tr.mapping.map(pos + 1), marker);
              changed = true;
            } else if (!inListItem && hasMarker) {
              const from = tr.mapping.map(pos + 1);
              tr.delete(from, from + node.firstChild!.nodeSize);
              changed = true;
            }
            return false;
          });
          return changed ? tr : null;
        },
      }),
    ];
  },
});

/** Meta key `ListItemExit` tags its own transaction with, so `ListSplitDefaults` can tell an actual split from two lists that merely ended up adjacent. */
const listSplitMetaKey = "listSplit";

/**
 * Enter on a list item whose paragraph holds nothing but its Marker lifts it
 * out into a plain paragraph — the split point requirement 3 needs, and
 * (at the first/last item) the usual "empty item exits the list" behaviour.
 * Overrides `ListItem`'s own Enter binding (`splitListItem`, from
 * `@tiptap/extension-list`): that command's own "is this item empty"
 * check requires `content.size === 0`, which is never true anymore now that
 * every item always carries a Marker — so it always took the *split*
 * branch (duplicating the item) instead of ever reaching the lift. Must be
 * listed after `ListItem` in `articleCanvasExtensions()`'s returned array —
 * Tiptap resolves same-key shortcuts across extensions in *reverse* array
 * order, so a later entry gets first refusal and can fall through (`return
 * false`) to let `ListItem`'s own binding run for a genuinely non-empty item.
 */
const ListItemExit = Extension.create({
  name: "listItemExit",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, view } = this.editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;
        const paragraph = $from.parent;
        if (paragraph.type.name !== DOC_NODE.paragraph) return false;
        const onlyMarker = paragraph.childCount === 1 && paragraph.firstChild?.type.name === DOC_NODE.listMarker;
        if (!onlyMarker || $from.parentOffset !== paragraph.content.size) return false;
        if ($from.node(-1)?.type.name !== DOC_NODE.listItem) return false;
        const itemType = state.schema.nodes[DOC_NODE.listItem];
        // Tag the transaction `liftListItem` builds internally (intercepting its own
        // `dispatch` callback) rather than dispatching it and tagging after the fact —
        // by the time it's dispatched it's already applied, too late to attach meta.
        return liftListItem(itemType)(state, (tr) => view.dispatch(tr.setMeta(listSplitMetaKey, true)));
      },
      // Backspace right after an item's Marker takes the item (text kept) out of the list,
      // exactly like Enter on an empty item — otherwise `ListMarkerIntegrity` just puts the
      // deleted Marker back and the keypress does nothing.
      Backspace: () => {
        const { state, view } = this.editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;
        const paragraph = $from.parent;
        if (paragraph.type.name !== DOC_NODE.paragraph) return false;
        if (paragraph.firstChild?.type.name !== DOC_NODE.listMarker) return false;
        if ($from.parentOffset > paragraph.firstChild.nodeSize) return false;
        if ($from.node(-1)?.type.name !== DOC_NODE.listItem) return false;
        const itemType = state.schema.nodes[DOC_NODE.listItem];
        return liftListItem(itemType)(state, (tr) => view.dispatch(tr.setMeta(listSplitMetaKey, true)));
      },
    };
  },
});

/**
 * What a list keeps, and doesn't, the moment `ListItemExit` splits it in
 * two: an ordered list's numbering continues from the half before it (the
 * only thing ADR 0005 says should carry over), while `background`/
 * `alignment` — and, via `liftListItem`'s plain node `.copy()`, would
 * otherwise also carry over unchanged — are reset, so a deliberately
 * coloured/aligned list doesn't silently paint content the author inserted
 * afterwards. Gated on `listSplitMetaKey`, not just "this list is freshly
 * created and sits next to one of the same kind" — two lists an author
 * happens to create back-to-back in separate actions (with or without
 * something between them) are common enough that adjacency alone would be a
 * false positive; only a transaction that actually came from `ListItemExit`
 * counts. Fires once, at creation — later edits never re-trigger it.
 */
const ListSplitDefaults = Extension.create({
  name: "listSplitDefaults",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("listSplitDefaults"),
        appendTransaction(transactions, oldState, state) {
          if (!transactions.some((t) => t.getMeta(listSplitMetaKey))) return null;
          const oldIds = new Set<string>();
          oldState.doc.forEach((node) => {
            if (typeof node.attrs.blockId === "string") oldIds.add(node.attrs.blockId);
          });
          const tr = state.tr;
          let changed = false;
          let precedingList: typeof state.doc.firstChild = null;
          state.doc.forEach((node, offset) => {
            const isList = node.type.name === DOC_NODE.bulletList || node.type.name === DOC_NODE.orderedList;
            if (!isList) return;
            const id = node.attrs.blockId as string | null;
            const isFresh = typeof id === "string" && !oldIds.has(id);
            if (isFresh && precedingList?.type.name === node.type.name) {
              if (node.attrs.background !== null) tr.setNodeAttribute(offset, "background", null);
              if (node.attrs.alignment !== null) tr.setNodeAttribute(offset, "alignment", null);
              if (node.type.name === DOC_NODE.orderedList) {
                const start = (typeof precedingList.attrs.start === "number" ? precedingList.attrs.start : 1) + precedingList.childCount;
                tr.setNodeAttribute(offset, "start", start);
              }
              changed = true;
            }
            precedingList = node;
          });
          return changed ? tr : null;
        },
      }),
    ];
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
        // `flip` (default true) picks above/below the caret; `shift`/`size` here clamp the
        // menu horizontally and cap its height (with scroll) when neither side has room —
        // Suggestion appends these after its own offset()/flip() middleware.
        floatingUi: {
          strategy: "fixed",
          middleware: [
            shift({ padding: 8 }),
            size({
              padding: 8,
              apply: ({ availableHeight, elements }) => {
                elements.floating.style.maxHeight = `${Math.max(160, availableHeight)}px`;
              },
            }),
          ],
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.run(editor);
        },
        render: () => {
          const emit = (p: SuggestionProps<BlockCommand, BlockCommand>) =>
            store?.open({
              items: p.items,
              select: p.command,
              getRect: () => p.clientRect?.() ?? null,
              contextElement: p.editor.view.dom,
              floatingUi: p.floatingUi,
            });
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

/** Exposes the `colorMenuStore` on `editor.storage` so `block-commands.ts`'s "Өнгө" slash command can open the same menu the toolbar button does, without prop-drilling. */
const ColorMenuAccess = Extension.create<{ store: ColorMenuStore | null }>({
  name: COLOR_MENU_STORAGE_KEY,
  addOptions() {
    return { store: null };
  },
  addStorage() {
    return { store: this.options.store };
  },
});

// ── Assembly ──────────────────────────────────────────────────────────────

export function articleCanvasExtensions(slashMenu: SlashMenuStore, mediaDialog: MediaDialogStore, colorMenu: ColorMenuStore): Extensions {
  return [
    StarterKit.configure({
      blockquote: false,
      bulletList: false,
      code: false,
      codeBlock: false,
      hardBreak: false,
      heading: false,
      listItem: false,
      orderedList: false,
      paragraph: false,
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
    // `color` is a node attr, not a mark: it applies to the whole heading (HeadingBlock.color), never a run of words.
    Heading.extend({
      marks: "",
      addAttributes() {
        return { ...this.parent?.(), ...colorAttribute("color", "data-color", "color"), ...alignmentAttribute() };
      },
    }).configure({ levels: [2, 3] }),
    Paragraph.extend({
      addAttributes() {
        return { ...this.parent?.(), ...alignmentAttribute() };
      },
    }),
    BulletList.extend({
      addAttributes() {
        return { ...this.parent?.(), ...alignmentAttribute() };
      },
    }),
    OrderedList.extend({
      addAttributes() {
        return { ...this.parent?.(), ...alignmentAttribute() };
      },
    }),
    // One level only: a list item is a single paragraph, never another list.
    ListItem.extend({ content: DOC_NODE.paragraph }),
    ListMarker,
    ListItemExit,
    Quote,
    Callout,
    PreservedBlockNode.configure({ mediaDialog }),
    // `ListSplitDefaults` reads the `blockId` `BlockIds` assigns, to tell a
    // freshly-split-off list from an untouched one — Tiptap resolves same-
    // pass `appendTransaction` hooks in *reverse* extension-array order, so
    // it must be listed before `BlockIds` here to run after it each pass.
    ListMarkerIntegrity,
    ListSplitDefaults,
    BlockIds,
    BlockBackground,
    TextColorMark,
    HighlightMark,
    BlockErrors,
    SlashCommand.configure({ store: slashMenu }),
    ColorMenuAccess.configure({ store: colorMenu }),
    Placeholder.configure({ placeholder: "Бичиж эхлэх, эсвэл «/» дарж блок нэмэх…" }),
  ];
}
