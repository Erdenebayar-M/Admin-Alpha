/**
 * WCAG 2 relative luminance / contrast ratio, for the custom colour picker's
 * readability warning (Admin-Alpha#9). Pure — no DOM — so it's unit-tested
 * directly; the picker only ever calls `isLowContrast`.
 */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelLuminance(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two `#rrggbb` colours: 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA's threshold for normal-size body text. */
export const READABLE_CONTRAST = 4.5;

/** True when `color` reads poorly `against` another colour — the picker's warning is advisory only, never a block. */
export function isLowContrast(color: string, against: string, threshold: number = READABLE_CONTRAST): boolean {
  return contrastRatio(color, against) < threshold;
}
