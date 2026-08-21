/*
 * WCAG 2.1 contrast, from the definitions rather than from a table.
 *
 * The editor needs this to tell a reader that a combination they just built cannot be read, at the
 * moment they build it. Nothing else in the site depends on it, and nothing here touches the DOM,
 * so it is tested against the values the specification itself states.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Accepts `#rgb` and `#rrggbb`. Returns null for anything else — including a colour we cannot read. */
export function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: Number.parseInt(hex[0]! + hex[0]!, 16),
      g: Number.parseInt(hex[1]! + hex[1]!, 16),
      b: Number.parseInt(hex[2]! + hex[2]!, 16),
    };
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  return null;
}

/** Relative luminance, WCAG 2.1 §relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const sRgb = value / 255;
    return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The ratio between two colours, from 1 to 21. Order does not matter. */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA Large' | 'fail';

/**
 * The best level a ratio reaches for the given text size. `large` is 18.66px bold or 24px plain,
 * as the specification defines it — the caller decides which it is asking about.
 */
export function contrastLevel(ratio: number, large = false): ContrastLevel {
  if (large) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'fail';
  }

  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  // Still enough for large text, which is worth saying rather than calling it a flat failure.
  if (ratio >= 3) return 'AA Large';
  return 'fail';
}
