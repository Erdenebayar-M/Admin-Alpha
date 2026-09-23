"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Ban, Palette as PaletteIcon } from "lucide-react";
import { colorCss, PALETTE_LABELS, tintCss } from "@/lib/article-colors";
import { DOC_MARK, DOC_NODE } from "@/lib/article-body";
import { PALETTE_COLORS, type ColorValue } from "@/lib/article-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { activeBackgroundNode, applyBackground, applyHighlight, applyTextColor, isHeadingActive, isSelectionOnlyLink } from "./color-commands";
import { CustomColorPicker, type CustomColorKind } from "./CustomColorPicker";
import type { ColorMenuScope } from "./color-menu-store";

const SECTION_TITLE: Record<CustomColorKind, string> = {
  color: "Текстийн өнгө",
  highlight: "Тодруулга",
  background: "Дэвсгэр",
};

function Swatch({
  label,
  css,
  selected,
  onClick,
  children,
}: {
  label: string;
  css?: string;
  selected?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={!!selected}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border",
        selected ? "border-ring ring-2 ring-ring/40" : "border-border",
      )}
      style={css ? { backgroundColor: css } : undefined}
    >
      {children}
    </button>
  );
}

function ColorSection({
  kind,
  current,
  usedColors,
  disabled,
  onSelect,
  onOpenCustom,
}: {
  kind: CustomColorKind;
  current: ColorValue | undefined;
  usedColors: string[];
  disabled: boolean;
  onSelect: (color: ColorValue | null) => void;
  onOpenCustom: () => void;
}) {
  const swatchCss = (color: ColorValue) => (kind === "color" ? colorCss(color) : tintCss(color));

  return (
    <div className={cn("space-y-2", disabled && "pointer-events-none opacity-40")}>
      <p className="text-xs font-medium text-muted-foreground">{SECTION_TITLE[kind]}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Swatch label="Анхны байдал" selected={!current} onClick={() => onSelect(null)}>
          <Ban className="size-3.5 text-muted-foreground" />
        </Swatch>
        {PALETTE_COLORS.map((color) => (
          <Swatch
            key={color}
            label={PALETTE_LABELS[color]}
            css={swatchCss(color)}
            selected={current === color}
            onClick={() => onSelect(color)}
          />
        ))}
        <button
          type="button"
          title="Захиалгат өнгө"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenCustom}
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
        >
          <PaletteIcon className="size-3.5" />
        </button>
      </div>
      {usedColors.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Энэ нийтлэлд ашигласан</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {usedColors.map((color) => (
              <Swatch key={color} label={color} css={swatchCss(color)} selected={current === color} onClick={() => onSelect(color)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ColorMenuProps {
  editor: Editor;
  scope: ColorMenuScope;
  usedColors: string[];
  onClose: () => void;
}

/** The colour menu's content: Text colour / Highlight / Background sections, or the custom picker in their place. */
export function ColorMenu({ editor, scope, usedColors, onClose }: ColorMenuProps) {
  const [customFor, setCustomFor] = useState<CustomColorKind | null>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const backgroundType = activeBackgroundNode(e);
      const heading = isHeadingActive(e);
      return {
        onlyLink: isSelectionOnlyLink(e),
        hasSelection: !e.state.selection.empty,
        heading,
        backgroundType,
        textColor: (heading ? e.getAttributes(DOC_NODE.heading).color : e.getAttributes(DOC_MARK.color).color) as ColorValue | undefined,
        highlightColor: e.getAttributes(DOC_MARK.highlight).color as ColorValue | undefined,
        backgroundColor: (backgroundType ? e.getAttributes(backgroundType).background : undefined) as ColorValue | undefined,
      };
    },
  });

  if (customFor) {
    const current = customFor === "color" ? state.textColor : customFor === "highlight" ? state.highlightColor : state.backgroundColor;
    return (
      <CustomColorPicker
        kind={customFor}
        initialHex={typeof current === "string" ? current : null}
        onCancel={() => setCustomFor(null)}
        onApply={(hex) => {
          if (customFor === "color") applyTextColor(editor, hex);
          else if (customFor === "highlight") applyHighlight(editor, hex);
          else applyBackground(editor, hex);
          setCustomFor(null);
          onClose();
        }}
      />
    );
  }

  const textDisabled = !state.hasSelection || state.onlyLink;

  return (
    <div className="w-72 space-y-4 p-3">
      {scope === "all" && (
        <ColorSection
          kind="color"
          current={state.textColor}
          usedColors={usedColors}
          disabled={textDisabled}
          onSelect={(color) => {
            applyTextColor(editor, color);
            onClose();
          }}
          onOpenCustom={() => setCustomFor("color")}
        />
      )}
      {scope === "all" && !state.heading && (
        <ColorSection
          kind="highlight"
          current={state.highlightColor}
          usedColors={usedColors}
          disabled={textDisabled}
          onSelect={(color) => {
            applyHighlight(editor, color);
            onClose();
          }}
          onOpenCustom={() => setCustomFor("highlight")}
        />
      )}
      {state.backgroundType ? (
        <ColorSection
          kind="background"
          current={state.backgroundColor}
          usedColors={usedColors}
          disabled={false}
          onSelect={(color) => {
            applyBackground(editor, color);
            onClose();
          }}
          onOpenCustom={() => setCustomFor("background")}
        />
      ) : (
        scope === "background" && <p className="p-1 text-xs text-muted-foreground">Энэ блок дэвсгэр өнгөтэй байж чадахгүй.</p>
      )}
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Хаах
        </Button>
      </div>
    </div>
  );
}
