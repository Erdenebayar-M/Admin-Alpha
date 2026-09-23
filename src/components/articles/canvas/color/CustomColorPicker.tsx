"use client";

import { useRef, useState } from "react";
import { isLowContrast } from "@/lib/color-contrast";
import { SITE_BODY_TEXT, SITE_PAGE_BACKGROUND, tintCss } from "@/lib/article-colors";
import { HEX_COLOR_RE } from "@/lib/article-types";
import { hexToHsv, hsvToHex, type Hsv } from "@/lib/hsv-color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_HEX = "#2f5be4";
const SQUARE_SIZE = 168;

/** What the custom colour is being picked for — decides which page surface the readability warning checks against. */
export type CustomColorKind = "color" | "highlight" | "background";

function contrastReference(kind: CustomColorKind): string {
  // Text colour is read against the page's own white background; a highlight or Block
  // background sits behind the site's body text, so it's checked against that ink instead.
  return kind === "color" ? SITE_PAGE_BACKGROUND : SITE_BODY_TEXT;
}

interface CustomColorPickerProps {
  kind: CustomColorKind;
  initialHex?: string | null;
  onApply: (hex: string) => void;
  onCancel: () => void;
}

/** Saturation/lightness square + hue slider + hex field + live preview + readability warning, Tailwind-only. */
export function CustomColorPicker({ kind, initialHex, onApply, onCancel }: CustomColorPickerProps) {
  const startHex = initialHex && HEX_COLOR_RE.test(initialHex) ? initialHex : DEFAULT_HEX;
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(startHex) ?? { h: 226, s: 79, v: 90 });
  const [hexInput, setHexInput] = useState(startHex);
  const squareRef = useRef<HTMLDivElement>(null);
  const hex = hsvToHex(hsv);

  function updateFromHex(value: string) {
    setHexInput(value);
    const parsed = hexToHsv(value.toLowerCase());
    if (parsed) setHsv(parsed);
  }

  function updateFromSquare(clientX: number, clientY: number) {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * 100;
    const v = 100 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)) * 100;
    setHsv((prev) => ({ ...prev, s, v }));
    setHexInput(hsvToHex({ ...hsv, s, v }));
  }

  function handleSquarePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromSquare(e.clientX, e.clientY);
  }

  function handleSquarePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    updateFromSquare(e.clientX, e.clientY);
  }

  function handleHue(h: number) {
    setHsv((prev) => ({ ...prev, h }));
    setHexInput(hsvToHex({ ...hsv, h }));
  }

  const against = contrastReference(kind);
  const lowContrast = isLowContrast(hex, against);

  return (
    <div className="space-y-3 p-3">
      <div
        ref={squareRef}
        aria-label="Өнгө сонгох"
        onPointerDown={handleSquarePointerDown}
        onPointerMove={handleSquarePointerMove}
        className="relative w-full cursor-crosshair rounded-md"
        style={{
          height: SQUARE_SIZE,
          backgroundColor: hsvToHex({ h: hsv.h, s: 100, v: 100 }),
          backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
      >
        <div
          className="pointer-events-none absolute size-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s}%`, bottom: `${hsv.v}%` }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={360}
        value={hsv.h}
        onChange={(e) => handleHue(Number(e.target.value))}
        aria-label="Өнгөний ая"
        className="h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      />

      <div className="flex items-center gap-2">
        <div className="size-8 shrink-0 rounded-md border border-border" style={{ backgroundColor: hex }} aria-hidden />
        <Input
          value={hexInput}
          onChange={(e) => updateFromHex(e.target.value)}
          placeholder="#2f5be4"
          className="font-mono text-sm"
          maxLength={7}
        />
      </div>

      <div
        className="rounded-md border border-border p-3 text-sm"
        style={{
          backgroundColor: kind === "background" ? tintCss(hex) : SITE_PAGE_BACKGROUND,
          color: kind === "color" ? hex : SITE_BODY_TEXT,
        }}
      >
        <span style={kind === "highlight" ? { backgroundColor: tintCss(hex), borderRadius: 4, padding: "0 2px" } : undefined}>
          Жишээ бичвэр
        </span>
      </div>

      {lowContrast && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
          Уншихад хэцүү байж магадгүй
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Болих
        </Button>
        <Button type="button" size="sm" onClick={() => onApply(hex)}>
          Ашиглах
        </Button>
      </div>
    </div>
  );
}
