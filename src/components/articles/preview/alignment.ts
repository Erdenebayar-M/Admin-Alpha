import type { TextAlignment } from "@/lib/article-types";

const ALIGNMENT_CLASSES: Record<"left" | TextAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** Tailwind text-alignment class for a Block's `alignment` — absent maps to `text-left`, matching how left is the unstored default (ADR 0004). */
export function alignmentClass(alignment: TextAlignment | undefined): string {
  return ALIGNMENT_CLASSES[alignment ?? "left"];
}
