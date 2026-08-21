import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import matter from 'gray-matter';
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
        const { data } = matter(readFileSync(path, 'utf8'));
        const where = `content/${locale}/${collection}/${file}`;

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
