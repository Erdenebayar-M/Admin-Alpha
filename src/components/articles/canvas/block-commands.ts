import type { Editor } from "@tiptap/core";
import {
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Video as VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { DOC_NODE, type PreservedBlock } from "@/lib/article-body";
import { getColorMenu } from "./color/color-menu-store";
import { getMediaDialog, type MediaBlockKind } from "./media-dialog-store";

/**
 * The insertable Block kinds, shared by the toolbar and the `/` slash menu
 * so both always offer the same set — and only kinds the Body can hold.
 */
export interface BlockCommand {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Extra words the slash menu matches on (Latin and Cyrillic). */
  keywords: string[];
  run: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
}

/** Opens the matching insert dialog; the Block is only added once the dialog is submitted. */
function insertMedia(editor: Editor, kind: MediaBlockKind) {
  const mediaDialog = getMediaDialog(editor);
  if (!mediaDialog) return;
  const insertBlock = (block: PreservedBlock) => {
    // `insertContent` replaces the current selection — fine for a text cursor, but if a
    // media Block atom is still selected (e.g. the user just clicked it to edit, closed the
    // dialog, and the atom stayed selected) it would silently delete that Block instead of
    // adding a new one after it. `insertContentAt` at the selection's own end always inserts,
    // never replaces.
    const pos = editor.state.selection.to;
    editor.chain().focus().insertContentAt(pos, { type: DOC_NODE.preserved, attrs: { block } }).run();
  };
  if (kind === "image") mediaDialog.open({ kind: "image", initial: null, onSubmit: insertBlock });
  else if (kind === "video") mediaDialog.open({ kind: "video", initial: null, onSubmit: insertBlock });
  else mediaDialog.open({ kind: "link_card", initial: null, onSubmit: insertBlock });
}

export const BLOCK_COMMANDS: BlockCommand[] = [
  {
    key: "h2",
    label: "Гарчиг 2",
    icon: Heading2,
    keywords: ["heading", "h2", "гарчиг"],
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive(DOC_NODE.heading, { level: 2 }),
  },
  {
    key: "h3",
    label: "Гарчиг 3",
    icon: Heading3,
    keywords: ["heading", "h3", "гарчиг"],
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive(DOC_NODE.heading, { level: 3 }),
  },
  {
    key: "bullet",
    label: "Цэгтэй жагсаалт",
    icon: List,
    keywords: ["list", "bullet", "ul", "жагсаалт"],
    run: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive(DOC_NODE.bulletList),
  },
  {
    key: "ordered",
    label: "Дугаартай жагсаалт",
    icon: ListOrdered,
    keywords: ["list", "ordered", "number", "ol", "жагсаалт", "дугаар"],
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive(DOC_NODE.orderedList),
  },
  {
    key: "quote",
    label: "Ишлэл",
    icon: Quote,
    keywords: ["quote", "blockquote", "ишлэл"],
    run: (e) => e.chain().focus().toggleNode(DOC_NODE.quote, DOC_NODE.paragraph).run(),
    isActive: (e) => e.isActive(DOC_NODE.quote),
  },
  {
    key: "callout",
    label: "Онцлох тэмдэглэл",
    icon: Info,
    keywords: ["callout", "note", "info", "онцлох", "тэмдэглэл"],
    run: (e) => e.chain().focus().toggleNode(DOC_NODE.callout, DOC_NODE.paragraph).run(),
    isActive: (e) => e.isActive(DOC_NODE.callout),
  },
  {
    key: "image",
    label: "Зураг",
    icon: ImageIcon,
    keywords: ["image", "picture", "upload", "зураг"],
    run: (e) => insertMedia(e, "image"),
    isActive: () => false,
  },
  {
    key: "video",
    label: "Видео",
    icon: VideoIcon,
    keywords: ["video", "youtube", "vimeo", "видео"],
    run: (e) => insertMedia(e, "video"),
    isActive: () => false,
  },
  {
    key: "link_card",
    label: "Холбоосын карт",
    icon: LinkIcon,
    keywords: ["link", "card", "холбоос", "карт"],
    run: (e) => insertMedia(e, "link_card"),
    isActive: () => false,
  },
  {
    key: "divider",
    label: "Хуваагч зураас",
    icon: Minus,
    keywords: ["divider", "hr", "line", "хуваагч", "зураас"],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
  },
];

/**
 * Slash-menu-only actions: not an insertable Block kind, so the toolbar
 * offers this through its own dedicated colour button instead of the
 * per-kind icon row `BLOCK_COMMANDS` drives — kept out of that list so the
 * two stay in sync as a set of Block kinds.
 */
const SLASH_ONLY_COMMANDS: BlockCommand[] = [
  {
    key: "background",
    label: "Өнгө",
    icon: Palette,
    keywords: ["color", "colour", "background", "өнгө", "дэвсгэр"],
    run: (e) => getColorMenu(e)?.open({ scope: "background" }),
    isActive: () => false,
  },
];

export function filterBlockCommands(query: string): BlockCommand[] {
  const all = [...BLOCK_COMMANDS, ...SLASH_ONLY_COMMANDS];
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.toLowerCase().startsWith(q)));
}
