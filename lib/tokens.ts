import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/*
 * The stylesheet is read as a file rather than imported, because importing it would hand a CSS
 * asset to the bundler and it has nowhere to put one inside a server chunk.
 *
 * The path is built from the project root instead of resolved. `require.resolve` is not available
 * here in any usable form — the bundler rewrites it to its own module id and it comes back as a
 * number — and `import.meta.resolve` returns a specifier the bundler has already rewritten too.
 * The cost is that this assumes a flat `node_modules`, which npm gives us; the failure, if that
 * ever stops being true, is the loud one below rather than a silently empty table.
 */
const STYLESHEET = join(process.cwd(), 'node_modules', '@kreobuddha', 'ui', 'dist', 'styles.css');

/*
 * The stylesheet the package publishes is the only source of truth about which tokens exist. The
 * library's own docs read the token stylesheets one file at a time, but those files are not
 * published — `dist/styles.css` is the whole set concatenated — so pages here select with prefixes
 * instead of by file.
 *
 * A token redeclared by the dark theme is one token, kept where the light theme declares it, which
 * is also the first occurrence.
 */
const DECLARATION = /(--kreo-[\w-]+)\s*:\s*([^;}]+)/g;

export interface Token {
  name: string;
  /** The value as declared for the light theme, verbatim — often `var(--kreo-…)`. */
  value: string;
}

let cache: Token[] | null = null;

export async function allTokens(): Promise<Token[]> {
  if (cache) return cache;

  let css: string;
  try {
    css = await readFile(STYLESHEET, 'utf8');
  } catch (cause) {
    throw new Error(
      `Could not read the library stylesheet at ${STYLESHEET}. The token tables are built from ` +
        'it, so this is a broken install rather than an empty section.',
      { cause },
    );
  }

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
