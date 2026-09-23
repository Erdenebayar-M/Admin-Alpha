/**
 * Hex <-> HSV conversion for the custom colour picker's saturation/lightness
 * square and hue slider (Admin-Alpha#9). HSV (not HSL) is the model: its
 * saturation/value plane is what composes cleanly into the square's two
 * flat CSS gradients (white -> transparent over the hue colour, black
 * transparent -> opaque over that) — an HSL plane doesn't render right with
 * the same two-gradient trick. Pure, unit-tested.
 */

export interface Hsv {
  /** 0-360 */
  h: number;
  /** 0-100 */
  s: number;
  /** 0-100 */
  v: number;
}

function clampByte(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHex2(n: number): string {
  return clampByte(n).toString(16).padStart(2, "0");
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `#${toHex2((r + m) * 255)}${toHex2((g + m) * 255)}${toHex2((b + m) * 255)}`;
}

/** `null` for a malformed hex string. */
export function hexToHsv(hex: string): Hsv | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}
