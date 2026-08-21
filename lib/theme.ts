/*
 * The theme editor's model: which tokens it edits, which pairs it judges, and how a theme travels
 * — into a URL, and out as CSS someone can paste.
 *
 * All of it is pure. The editor is a client component; this file is what makes its behaviour
 * testable without one.
 */

export const themeModes = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof themeModes)[number];

export function isThemeMode(value: string): value is ThemeMode {
  return (themeModes as readonly string[]).includes(value);
}

/** Where the chosen mode is kept. Read by the blocking script in the document head. */
export const THEME_STORAGE_KEY = 'kb-docs-theme';

export interface EditableToken {
  name: string;
  label: string;
  description: string;
}

/*
 * A deliberately short list. The library publishes 135 custom properties, and an editor offering
 * all of them is a spreadsheet: these are the ones that decide what a theme looks like, and every
 * other token either follows from them or is structural.
 */
export const editableTokens: EditableToken[] = [
  {
    name: '--kreo-surface-page',
    label: 'Page',
    description: 'The surface everything else sits on.',
  },
  { name: '--kreo-surface-card', label: 'Card', description: 'Raised surfaces inside the page.' },
  { name: '--kreo-text-body', label: 'Body text', description: 'Ordinary readable text.' },
  { name: '--kreo-text-muted', label: 'Muted text', description: 'Captions, hints and metadata.' },
  { name: '--kreo-accent-500', label: 'Accent', description: 'The hue actions are drawn in.' },
  {
    name: '--kreo-text-on-accent',
    label: 'Text on accent',
    description: 'Labels sitting on the accent itself.',
  },
  { name: '--kreo-border-default', label: 'Border', description: 'The line that separates things.' },
];

export interface ContrastPair {
  foreground: string;
  background: string;
  label: string;
  /** Non-text pairs are judged against 3:1, the threshold for a boundary rather than a word. */
  nonText?: boolean;
}

export const contrastPairs: ContrastPair[] = [
  { foreground: '--kreo-text-body', background: '--kreo-surface-page', label: 'Body on page' },
  { foreground: '--kreo-text-muted', background: '--kreo-surface-page', label: 'Muted on page' },
  { foreground: '--kreo-text-body', background: '--kreo-surface-card', label: 'Body on card' },
  {
    foreground: '--kreo-text-on-accent',
    background: '--kreo-accent-500',
    label: 'Label on accent',
  },
  {
    foreground: '--kreo-border-default',
    background: '--kreo-surface-page',
    label: 'Border on page',
    nonText: true,
  },
];

export const presets: { id: string; label: string; values: Record<string, string> }[] = [
  {
    id: 'slate',
    label: 'Slate',
    values: {
      '--kreo-surface-page': '#f7f8f9',
      '--kreo-surface-card': '#ffffff',
      '--kreo-text-body': '#1b1f24',
      '--kreo-text-muted': '#5b636d',
      '--kreo-accent-500': '#2f5d8c',
      '--kreo-text-on-accent': '#ffffff',
      '--kreo-border-default': '#d4d8dd',
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    values: {
      '--kreo-surface-page': '#10130f',
      '--kreo-surface-card': '#171b15',
      '--kreo-text-body': '#e3e9df',
      '--kreo-text-muted': '#98a292',
      '--kreo-accent-500': '#5f9c4b',
      '--kreo-text-on-accent': '#0c0f0b',
      '--kreo-border-default': '#2c332a',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    values: {
      '--kreo-surface-page': '#fffaf2',
      '--kreo-surface-card': '#ffffff',
      '--kreo-text-body': '#2a2118',
      '--kreo-text-muted': '#6d5f4e',
      '--kreo-accent-500': '#9a5b12',
      '--kreo-text-on-accent': '#ffffff',
      '--kreo-border-default': '#e6d9c6',
    },
  },
];

/*
 * A token's literal value, following `var(--x)` references until one is reached.
 *
 * The published stylesheet defines half its tokens in terms of others — `--kreo-surface-card` is
 * `var(--kreo-neutral-0)` — and a colour input needs a colour. A reference that goes nowhere, or
 * goes round in a circle, returns null rather than a guess.
 */
export function resolveTokenValue(
  values: Map<string, string>,
  name: string,
  seen: Set<string> = new Set(),
): string | null {
  if (seen.has(name)) return null;
  seen.add(name);

  const value = values.get(name);
  if (value === undefined) return null;

  const reference = /^var\(\s*(--[\w-]+)/.exec(value);
  if (reference) return resolveTokenValue(values, reference[1]!, seen);

  return value.trim();
}

/** The tokens that differ from where they started. A theme is what was changed, not everything. */
export function changedTokens(
  values: Record<string, string>,
  defaults: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([name, value]) => value.toLowerCase() !== (defaults[name] ?? '').toLowerCase(),
    ),
  );
}

/*
 * A theme in a URL fragment: `#theme=surface-page:f7f8f9,accent-500:2f5d8c`.
 *
 * The fragment rather than a query string, and the `--kreo-` prefix dropped, because the whole
 * thing has to survive being pasted into a chat window. A static site has no server to shorten
 * links with, so the link is the storage.
 */
export function encodeTheme(changed: Record<string, string>): string {
  const parts = Object.entries(changed).map(
    ([name, value]) => `${name.replace(/^--kreo-/, '')}:${value.replace(/^#/, '')}`,
  );
  return parts.length === 0 ? '' : `theme=${parts.join(',')}`;
}

export function decodeTheme(hash: string): Record<string, string> {
  const body = hash.replace(/^#/, '');
  if (!body.startsWith('theme=')) return {};

  const known = new Set(editableTokens.map((token) => token.name));
  const values: Record<string, string> = {};

  for (const part of body.slice('theme='.length).split(',')) {
    const [name, value] = part.split(':');
    if (name === undefined || value === undefined) continue;

    const full = `--kreo-${name}`;
    // A link is something a stranger wrote. Anything not on the list, or not a colour, is dropped
    // rather than written into a stylesheet.
    if (!known.has(full)) continue;
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) continue;

    values[full] = `#${value.toLowerCase()}`;
  }

  return values;
}

/** The theme as a stylesheet a consumer can paste into their own application. */
export function exportCss(changed: Record<string, string>): string {
  const entries = Object.entries(changed);
  if (entries.length === 0) return '/* Nothing changed yet. */';

  const declarations = entries.map(([name, value]) => `  ${name}: ${value};`).join('\n');
  return `:root {\n${declarations}\n}`;
}
