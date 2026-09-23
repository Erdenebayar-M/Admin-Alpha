"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link2, Palette } from "lucide-react";
import { DOC_MARK } from "@/lib/article-body";
import type { TextAlignment } from "@/lib/article-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BLOCK_COMMANDS } from "./block-commands";
import { activeBackgroundNode, applyBlockAttrs } from "./color/color-commands";
import { ColorMenu } from "./color/ColorMenu";
import type { ColorMenuStore } from "./color/color-menu-store";

const noColorMenu = () => null;

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
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
      disabled={disabled}
      // Keep the editor's selection: a click must not move focus off the canvas first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(active && "bg-muted text-foreground")}
    >
      {children}
    </Button>
  );
}

/**
 * Text alignment (Admin-Alpha#10), scoped identically to Colour's background
 * (ADR 0004): reuses `activeBackgroundNode` to find the same five Block
 * kinds' top-level node, since divider/image/video/link_card must never gain
 * an `alignment` attr either.
 */
const ALIGNMENT_BUTTONS: { value: TextAlignment | "left"; label: string; icon: typeof AlignLeft }[] = [
  { value: "left", label: "Зүүн зэрэгцүүлэх", icon: AlignLeft },
  { value: "center", label: "Голлуулах", icon: AlignCenter },
  { value: "right", label: "Баруун зэрэгцүүлэх", icon: AlignRight },
];

function applyAlignment(editor: Editor, alignment: TextAlignment | "left"): void {
  applyBlockAttrs(editor, { alignment: alignment === "left" ? null : alignment });
}

const Separator = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;

/** Formatting + Block-kind buttons. Offers only what the Article Body can hold. */
export function CanvasToolbar({
  editor,
  onLink,
  colorMenu,
  usedColors,
}: {
  editor: Editor;
  onLink: () => void;
  colorMenu: ColorMenuStore;
  usedColors: string[];
}) {
  const colorRequest = useSyncExternalStore(colorMenu.subscribe, colorMenu.getSnapshot, noColorMenu);
  const colorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorRequest) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!colorContainerRef.current?.contains(e.target as Node)) colorMenu.close();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [colorRequest, colorMenu]);

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const alignmentNode = activeBackgroundNode(e);
      const rawAlignment = alignmentNode ? e.getAttributes(alignmentNode).alignment : null;
      return {
        bold: e.isActive(DOC_MARK.bold),
        italic: e.isActive(DOC_MARK.italic),
        link: e.isActive(DOC_MARK.link),
        blocks: Object.fromEntries(BLOCK_COMMANDS.map((c) => [c.key, c.isActive(e)])),
        alignmentNode,
        // `null` (no button lit) when the selection isn't in an alignment-eligible Block at
        // all — not "left", which would light the Left button while every button is disabled.
        alignment: alignmentNode
          ? ((rawAlignment === "center" || rawAlignment === "right" ? rawAlignment : "left") as TextAlignment | "left")
          : null,
      };
    },
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
      <div className="relative" ref={colorContainerRef}>
        <ToolbarButton
          label="Өнгө"
          active={!!colorRequest}
          onClick={() => (colorRequest ? colorMenu.close() : colorMenu.open({ scope: "all" }))}
        >
          <Palette />
        </ToolbarButton>
        {colorRequest && (
          <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <ColorMenu editor={editor} scope={colorRequest.scope} usedColors={usedColors} onClose={colorMenu.close} />
          </div>
        )}
      </div>
      <Separator />
      {ALIGNMENT_BUTTONS.map(({ value, label, icon: Icon }) => (
        <ToolbarButton
          key={value}
          label={label}
          active={active.alignment === value}
          disabled={!active.alignmentNode}
          onClick={() => applyAlignment(editor, value)}
        >
          <Icon />
        </ToolbarButton>
      ))}
      {BLOCK_COMMANDS.map((command, i) => (
        <span key={command.key} className="contents">
          {(i === 0 || command.key === "bullet" || command.key === "quote" || command.key === "image") && <Separator />}
          <ToolbarButton label={command.label} active={!!active.blocks[command.key]} onClick={() => command.run(editor)}>
            <command.icon />
          </ToolbarButton>
        </span>
      ))}
      <span className="ml-auto hidden pr-1 text-xs text-muted-foreground sm:inline">«/» — блок нэмэх</span>
    </div>
  );
}
