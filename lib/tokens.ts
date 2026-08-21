import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Built from the project root: the bundler rewrites both require.resolve and import.meta.resolve.
const STYLESHEET = join(process.cwd(), 'node_modules', '@kreobuddha', 'ui', 'dist', 'styles.css');

const DECLARATION = /(--kreo-[\w-]+)\s*:\s*([^;}]+)/g;

export interface Token {
  name: string;
  value: string;
}

let cache: Token[] | null = null;

async function readStylesheet(): Promise<string> {
  try {
    return await readFile(STYLESHEET, 'utf8');
  } catch (cause) {
    throw new Error(
      `Could not read the library stylesheet at ${STYLESHEET}. The token tables and the theme ` +
        'editor are built from it, so this is a broken install rather than an empty section.',
      { cause },
    );
  }
}

export async function allTokens(): Promise<Token[]> {
  if (cache) return cache;

  const css = await readStylesheet();

  const tokens: Token[] = [];
  const seen = new Set<string>();

  for (const [, name, value] of css.matchAll(DECLARATION)) {
    if (name === undefined || value === undefined || seen.has(name)) continue;
    seen.add(name);
    tokens.push({ name, value: value.trim() });
  }

  cache = tokens;
  return tokens;
}

export async function tokenMaps(): Promise<{ light: Map<string, string>; dark: Map<string, string> }> {
  const css = await readStylesheet();

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

  return { light, dark };
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

export async function selectTokens(include?: string[], exclude?: string[]): Promise<Token[]> {
  const tokens = await allTokens();

  const kept = tokens.filter(({ name }) => {
    const included = include === undefined || include.some((prefix) => name.startsWith(prefix));
    const excluded = exclude !== undefined && exclude.some((prefix) => name.startsWith(prefix));
    return included && !excluded;
  });

  if (kept.length === 0) {
    throw new Error(
      `No tokens matched include=${JSON.stringify(include)} exclude=${JSON.stringify(exclude)}. ` +
        'A table that lists nothing is a renamed token, not an empty section.',
    );
  }

  return kept;
}
