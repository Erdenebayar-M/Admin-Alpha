import type { Editor } from "@tiptap/core";
import { Heading2, Heading3, Info, List, ListOrdered, Minus, Quote, type LucideIcon } from "lucide-react";
import { DOC_NODE } from "@/lib/article-body";

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
    key: "divider",
    label: "Хуваагч зураас",
    icon: Minus,
    keywords: ["divider", "hr", "line", "хуваагч", "зураас"],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
  },
];

export function filterBlockCommands(query: string): BlockCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return BLOCK_COMMANDS;
  return BLOCK_COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.toLowerCase().startsWith(q)),
  );
}
