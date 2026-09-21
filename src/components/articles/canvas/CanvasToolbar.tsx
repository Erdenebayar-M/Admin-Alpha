"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Bold, Italic, Link2 } from "lucide-react";
import { DOC_MARK } from "@/lib/article-body";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BLOCK_COMMANDS } from "./block-commands";

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      // Keep the editor's selection: a click must not move focus off the canvas first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(active && "bg-muted text-foreground")}
    >
      {children}
    </Button>
  );
}

const Separator = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;

/** Formatting + Block-kind buttons. Offers only what the Article Body can hold. */
export function CanvasToolbar({ editor, onLink }: { editor: Editor; onLink: () => void }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive(DOC_MARK.bold),
      italic: e.isActive(DOC_MARK.italic),
      link: e.isActive(DOC_MARK.link),
      blocks: Object.fromEntries(BLOCK_COMMANDS.map((c) => [c.key, c.isActive(e)])),
    }),
  });

  return (
    <div
      role="toolbar"
      aria-label="Засварлах хэрэгсэл"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-border bg-card/95 px-2 py-1.5 backdrop-blur"
    >
      <ToolbarButton label="Тод (Ctrl+B)" active={active.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </ToolbarButton>
      <ToolbarButton label="Налуу (Ctrl+I)" active={active.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Холбоос" active={active.link} onClick={onLink}>
        <Link2 />
      </ToolbarButton>
      {BLOCK_COMMANDS.map((command, i) => (
        <span key={command.key} className="contents">
          {(i === 0 || command.key === "bullet" || command.key === "quote") && <Separator />}
          <ToolbarButton label={command.label} active={!!active.blocks[command.key]} onClick={() => command.run(editor)}>
            <command.icon />
          </ToolbarButton>
        </span>
      ))}
      <span className="ml-auto hidden pr-1 text-xs text-muted-foreground sm:inline">«/» — блок нэмэх</span>
    </div>
  );
}
