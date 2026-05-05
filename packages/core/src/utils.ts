import type { MeshGradientColorsConfig, Vec3 } from './types';

/**
 * Converts HEX color to normalized RGB array (0-1)
 * @param hexCode - HEX color code
 * @returns RGB array [r, g, b] in range 0-1
 */
export function normalizeColor(hexCode: number): Vec3 {
  const red = ((hexCode >> 16) & 255) / 255;
  const green = ((hexCode >> 8) & 255) / 255;
  const blue = (255 & hexCode) / 255;

  return [red, green, blue];
}

/** HSL (0–360, 0–1, 0–1) → sRGB hex `#rrggbb`. */
function hslToHex(hIn: number, s: number, l: number): string {
  const h = ((hIn % 360) + 360) % 360;
  const hp = h / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Parses hex color string and handles different formats
 * @param hexValue - hex color value from CSS
 * @returns parsed integer or null if invalid
 */
export function parseHexColor(hexValue: string): number | null {
  const trimmed = hexValue.trim();

  if (!(trimmed && trimmed.startsWith('#'))) return null;

  const body = trimmed.slice(1);

  /** #RGB → #RRGGBB */
  if (body.length === 3) {
    const expanded = body
      .split('')
      .map((c) => c + c)
      .join('');

    const parsed = Number.parseInt(expanded, 16);

    return Number.isFinite(parsed) ? parsed : null;
  }

  /** #RRGGBB or #RRGGBBAA (alpha ignored for mesh colors) */
  if (body.length === 8) {
    const parsed = Number.parseInt(body.slice(0, 6), 16);

    return Number.isFinite(parsed) ? parsed : null;
  }

  if (body.length === 6) {
    const parsed = Number.parseInt(body, 16);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Generates four saturated colors in hex (HSL-based for more pleasing palettes).
 */
export function genRandomColors(rand: () => number = Math.random): MeshGradientColorsConfig {
  const colors: string[] = [];

  for (let i = 0; i < 4; i++) {
    const h = rand() * 360;
    const s = 0.55 + rand() * 0.35;
    const l = 0.42 + rand() * 0.22;

    colors.push(hslToHex(h, s, l));
  }

  return colors as MeshGradientColorsConfig;
}
