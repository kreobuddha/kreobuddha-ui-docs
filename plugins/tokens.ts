import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';

// Built from the project root: a bundler rewrites both require.resolve and import.meta.resolve.
const STYLESHEET = join(process.cwd(), 'node_modules', '@kreobuddha', 'ui', 'dist', 'styles.css');

const DECLARATION = /(--kreo-[\w-]+)\s*:\s*([^;}]+)/g;

const VIRTUAL_ID = 'virtual:tokens';
const RESOLVED_ID = '\0virtual:tokens';

export interface Token {
  name: string;
  value: string;
}

function readStylesheet(): string {
  try {
    return readFileSync(STYLESHEET, 'utf8');
  } catch (cause) {
    throw new Error(
      `Could not read the library stylesheet at ${STYLESHEET}. The token tables are built from ` +
        'it, so this is a broken install rather than an empty section.',
      { cause },
    );
  }
}

function darkBlocks(css: string): string[] {
  const blocks: string[] = [];
  const selector = /\[data-kreo-theme=["']?dark["']?\][^{]*\{/g;

  for (const match of css.matchAll(selector)) {
    const start = (match.index ?? 0) + match[0].length;
    const end = css.indexOf('}', start);
    if (end !== -1) blocks.push(css.slice(start, end));
  }

  return blocks;
}

export function readTokens(): { tokens: Token[]; light: [string, string][]; dark: [string, string][] } {
  const css = readStylesheet();

  const light = new Map<string, string>();
  for (const [, name, value] of css.matchAll(DECLARATION)) {
    if (name !== undefined && value !== undefined && !light.has(name)) light.set(name, value.trim());
  }

  const dark = new Map(light);
  for (const block of darkBlocks(css)) {
    for (const [, name, value] of block.matchAll(DECLARATION)) {
      if (name !== undefined && value !== undefined) dark.set(name, value.trim());
    }
  }

  return {
    tokens: [...light].map(([name, value]) => ({ name, value })),
    light: [...light],
    dark: [...dark],
  };
}

export function resolveTokenValue(map: Map<string, string>, name: string, seen = new Set<string>()): string | null {
  if (seen.has(name)) return null;
  seen.add(name);

  const value = map.get(name);
  if (value === undefined) return null;

  const reference = /^var\(\s*(--kreo-[\w-]+)/.exec(value);
  return reference ? resolveTokenValue(map, reference[1], seen) : value;
}

export function pageColours(): { light: string; dark: string } {
  const { light, dark } = readTokens();
  const lightMap = new Map(light);
  const darkMap = new Map(dark);

  return {
    light: resolveTokenValue(lightMap, '--kreo-surface-page') ?? '#ffffff',
    dark: resolveTokenValue(darkMap, '--kreo-surface-page') ?? '#000000',
  };
}

export function tokens(): Plugin {
  return {
    name: 'kreobuddha-tokens',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;

      const { tokens, light, dark } = readTokens();
      return [
        `export const tokens = ${JSON.stringify(tokens)};`,
        `export const light = new Map(${JSON.stringify(light)});`,
        `export const dark = new Map(${JSON.stringify(dark)});`,
      ].join('\n');
    },

    transformIndexHtml(html) {
      const { light, dark } = pageColours();
      return html
        .replace('%THEME_LIGHT%', light)
        .replace('%THEME_DARK%', dark);
    },
  };
}
