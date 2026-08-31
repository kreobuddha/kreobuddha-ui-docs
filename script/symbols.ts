import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { readEntries } from './content.ts';

const COMPONENTS = join(process.cwd(), 'node_modules', '@kreobuddha', 'ui', 'dist', 'components');

function slugOf(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function readSymbols(): Map<string, string> {
  const documented = new Set(
    readEntries()
      .filter((entry) => entry.collection === 'components')
      .map((entry) => entry.slug),
  );

  let published: string[];
  try {
    published = readdirSync(COMPONENTS);
  } catch (cause) {
    throw new Error(
      `Could not read the library components at ${COMPONENTS}. The links from code samples are ` +
        'built from it, so this is a broken install rather than an empty list.',
      { cause },
    );
  }

  const symbols = new Map<string, string>();

  for (const name of published) {
    if (!/^[A-Z]/.test(name)) continue;

    const slug = slugOf(name);
    if (documented.has(slug)) symbols.set(name, slug);
  }

  return symbols;
}
