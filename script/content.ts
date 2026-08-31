import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';

const ROOT = join(process.cwd(), 'content');

const VIRTUAL_ID = 'virtual:content';
const RESOLVED_ID = '\0virtual:content';

export interface Entry {
  locale: string;
  collection: string;
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  updated: string | null;
}

function frontmatter(source: string, file: string): Record<string, string | number> {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (block === null) throw new Error(`${file}: no frontmatter.`);

  const data: Record<string, string | number> = {};

  for (const line of block[1]!.split(/\r?\n/)) {
    if (line.trim() === '') continue;

    const colon = line.indexOf(':');
    if (colon === -1) throw new Error(`${file}: frontmatter is flat 'key: value', not YAML: ${line}`);

    const value = line
      .slice(colon + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');

    data[line.slice(0, colon).trim()] = /^\d+$/.test(value) ? Number(value) : value;
  }

  return data;
}

// A shallow clone has no history to read, so this is null far more often than it looks — on any
// checkout without fetch-depth: 0, and on a file that is not committed yet.
function lastChanged(path: string): string | null {
  try {
    const stamp = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    return stamp === '' ? null : stamp;
  } catch {
    return null;
  }
}

function require_(value: unknown, kind: 'string' | 'number', field: string, file: string): void {
  if (typeof value !== kind || (kind === 'string' && value === '')) {
    throw new Error(`${file}: frontmatter needs a ${kind} '${field}'.`);
  }
}

export function readEntries(): Entry[] {
  const entries: Entry[] = [];

  for (const locale of readdirSync(ROOT)) {
    for (const collection of readdirSync(join(ROOT, locale))) {
      for (const file of readdirSync(join(ROOT, locale, collection))) {
        if (!file.endsWith('.mdx')) continue;

        const path = join(ROOT, locale, collection, file);
        const where = `content/${locale}/${collection}/${file}`;
        const data = frontmatter(readFileSync(path, 'utf8'), where);

        require_(data['title'], 'string', 'title', where);
        require_(data['description'], 'string', 'description', where);
        require_(data['order'], 'number', 'order', where);

        const group = collection === 'components' ? 'components' : data['group'];
        require_(group, 'string', 'group', where);

        entries.push({
          locale,
          collection,
          slug: file.replace(/\.mdx$/, ''),
          title: data['title'] as string,
          description: data['description'] as string,
          group: group as string,
          order: data['order'] as number,
          updated: lastChanged(path),
        });
      }
    }
  }

  return entries;
}

export function content(): Plugin {
  return {
    name: 'kreobuddha-content',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      return id === RESOLVED_ID ? `export const entries = ${JSON.stringify(readEntries())};` : null;
    },
  };
}
