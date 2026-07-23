/*
 *
 * Source: https://pjonori.codes/projects/contrasting-color/
 * Full disclosure on a few points:
 * 1) I pulled functions from _numerous_ sources, so big thanks for folks for sharing code.
 *    I will try to retrace my history and provide credits where credit is due.
 *
 * 2) The code is still a mess and not fully tested. Some of the lines of code I still don't
 *    fully understand _why_ it works - which is always a "good" sign. This is only intended
 *    to be a proof of concept. A lot more work needs to happen to get this in a place that
 *    I'm confident with.
 *
 * 3) I'm still trying to work out how this kind of color develop flow would actually work.
 *    I am not a color expert - by a long shot - and so more vetting/thinking needs to occur.
 *    Some of the things I'm doing could very well be poor practices in relation to color
 *    theory. I'm learning as I go.
 */

const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;

const GAMMA = 2.4;

export type Rgb = readonly [number, number, number]; // each channel in range 0..1
export type Hsl = readonly [number, number, number]; // h,s,l in range 0..1
export type ContrastType = "auto" | "lighter" | "darker";

export function contrast(rgb1: Rgb, rgb2: Rgb): number {
  const lum1 = luminance(rgb1);
  const lum2 = luminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function luminance(rgb: Rgb): number {
  // Gamma expand each channel.
  const a = rgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, GAMMA),
  ) as unknown as Rgb;

  return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
}

export function hslToRgb(hsl: Hsl): Rgb {
  const [h, s, l] = hsl;

  if (s === 0) {
    return [l, l, l];
  }

  const hue2rgb = (p: number, q: number, t0: number): number => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return [r, g, b];
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const [r, g, b] = rgb;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l]; // achromatic
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }

  h /= 6;
  return [h, s, l];
}

export function getContrastingColor(
  h: number,
  s: number,
  rgb1: Rgb,
  ratio: number,
  type: ContrastType = "auto",
): Rgb | null {
  let inc = -0.001;

  // Decide which direction to walk the lightness axis.
  if (
    type === "lighter" ||
    (type === "auto" &&
      contrast(rgb1, [1, 1, 1]) > contrast(rgb1, [0, 0, 0]))
  ) {
    inc = -inc;
  }

  let l2 = luminance(rgb1);

  const roundTo1dp = (n: number) => Math.round(n * 10) / 10;

  // Iterate until we hit (or narrowly exceed) the requested contrast ratio.
  while (true) {
    const candidate = hslToRgb([h, s, l2]);
    const c = contrast(rgb1, candidate);

    if (c >= ratio && roundTo1dp(c) <= ratio) {
      return candidate;
    }

    l2 += inc;
    if (l2 >= 1 || l2 <= 0) {
      return null;
    }
  }
}

export function rgbToHex(rgb: Rgb): string {
  const [r, g, b] = rgb;

  const toByte = (v: number) =>
    Math.min(255, Math.max(0, Math.round(v * 255)));

  return (
    "#" +
    ((1 << 24) + (toByte(r) << 16) + (toByte(g) << 8) + toByte(b))
      .toString(16)
      .slice(1)
  );
}

export function hexToRgb(hex: string): Rgb | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function parseCssNumber(n: string): number | null {
  const v = Number(n.trim());
  return Number.isFinite(v) ? v : null;
}

function parseRgbChannel(s: string): number | null {
  const trimmed = s.trim();

  if (trimmed.endsWith("%")) {
    const pct = parseCssNumber(trimmed.slice(0, -1));
    if (pct == null) return null;
    return clamp01(pct / 100);
  }

  const v = parseCssNumber(trimmed);
  if (v == null) return null;
  // CSS rgb() allows 0..255.
  return clamp01(v / 255);
}

function parseAlphaChannel(s: string): number | null {
  const trimmed = s.trim();

  if (trimmed.endsWith("%")) {
    const pct = parseCssNumber(trimmed.slice(0, -1));
    if (pct == null) return null;
    return clamp01(pct / 100);
  }

  const v = parseCssNumber(trimmed);
  if (v == null) return null;
  return clamp01(v);
}

function parseHue(s: string): number | null {
  // Accept plain degrees (e.g. 120) and deg (e.g. 120deg)
  const trimmed = s.trim().toLowerCase();
  const val = trimmed.endsWith("deg") ? trimmed.slice(0, -3) : trimmed;
  const v = parseCssNumber(val);
  if (v == null) return null;

  // Normalize to 0..1
  const deg = ((v % 360) + 360) % 360;
  return deg / 360;
}

function parseHslPercent(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed.endsWith("%")) return null;
  const pct = parseCssNumber(trimmed.slice(0, -1));
  if (pct == null) return null;
  return clamp01(pct / 100);
}

function parseHexColor(input: string): Rgb | null {
  let hex = input.trim();
  if (hex.startsWith("#")) hex = hex.slice(1);

  // Support #rgb, #rgba, #rrggbb, #rrggbbaa
  if (hex.length === 3 || hex.length === 4) {
    const r = hex[0] + hex[0];
    const g = hex[1] + hex[1];
    const b = hex[2] + hex[2];
    // ignore alpha if present
    return hexToRgb(r + g + b);
  }

  if (hex.length === 6 || hex.length === 8) {
    // ignore alpha if present
    return hexToRgb(hex.slice(0, 6));
  }

  return null;
}

function splitCssArgs(args: string): string[] {
  // Supports either comma-separated or space-separated formats.
  // Also supports optional "/" alpha separator.
  const normalized = args.replace(/\s*\/\s*/, ",");
  return normalized
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseRgbFunc(input: string): Rgb | null {
  const m = /^rgba?\((.*)\)$/i.exec(input.trim());
  if (!m) return null;

  const parts = splitCssArgs(m[1]);
  if (parts.length < 3) return null;

  const r = parseRgbChannel(parts[0]);
  const g = parseRgbChannel(parts[1]);
  const b = parseRgbChannel(parts[2]);
  if (r == null || g == null || b == null) return null;

  // alpha is optional; we ignore it for contrast computations.
  if (parts.length >= 4) {
    const a = parseAlphaChannel(parts[3]);
    if (a == null) return null;
  }

  return [r, g, b];
}

function parseHslFunc(input: string): Rgb | null {
  const m = /^hsla?\((.*)\)$/i.exec(input.trim());
  if (!m) return null;

  const parts = splitCssArgs(m[1]);
  if (parts.length < 3) return null;

  const h = parseHue(parts[0]);
  const s = parseHslPercent(parts[1]);
  const l = parseHslPercent(parts[2]);
  if (h == null || s == null || l == null) return null;

  // alpha is optional; we ignore it.
  if (parts.length >= 4) {
    const a = parseAlphaChannel(parts[3]);
    if (a == null) return null;
  }

  return hslToRgb([h, s, l]);
}

/**
 * Detects common CSS color string formats and returns normalized RGB tuple (0..1 per channel).
 * Supported formats:
 * - #rgb, #rgba, #rrggbb, #rrggbbaa
 * - rgb(...), rgba(...)
 * - hsl(...), hsla(...)
 */
export function cssColorToRgb(input: string): Rgb | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("#")) return parseHexColor(trimmed);
  if (/^rgba?\(/i.test(trimmed)) return parseRgbFunc(trimmed);
  if (/^hsla?\(/i.test(trimmed)) return parseHslFunc(trimmed);

  return null;
}

export function rgbToCssRgbString(rgb: Rgb): string {
  const [r, g, b] = rgb;
  const toByte = (v: number) =>
    Math.min(255, Math.max(0, Math.round(v * 255)));
  // Modern CSS accepts space-separated rgb() too, but this is widely compatible.
  return `rgb(${toByte(r)}, ${toByte(g)}, ${toByte(b)})`;
}

/**
 * High-level helper:
 * - auto-detects/decodes an input CSS color string into RGB
 * - finds a contrasting color (same hue/sat, adjusted lightness) at the requested ratio
 * - returns the result as a CSS `rgb(r, g, b)` string
 */
export function getContrastingColorCssRgb(
  inputColor: string,
  ratio: number,
  type: ContrastType = "auto",
): string | null {
  const baseRgb = cssColorToRgb(inputColor);
  if (!baseRgb) return null;

  const [h, s] = rgbToHsl(baseRgb);
  const out = getContrastingColor(h, s, baseRgb, ratio, type);
  return out ? rgbToHex(out) : null;
}

// NOTE: the old file executed a demo at import-time via console.log/console.error.
// That’s a footgun for UI bundles, so it’s removed.
// If you want a quick local demo, run this file directly with tsx/node in a sandbox.
