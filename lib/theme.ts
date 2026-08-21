export const themeModes = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof themeModes)[number];

export function isThemeMode(value: string): value is ThemeMode {
  return (themeModes as readonly string[]).includes(value);
}

export const THEME_STORAGE_KEY = 'kb-docs-theme';

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
