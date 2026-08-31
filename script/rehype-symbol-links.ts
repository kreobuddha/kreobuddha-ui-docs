import type { Plugin } from 'unified';

interface Node {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
}

interface File {
  path?: string;
}

const SOURCE = /content\/(en|ru)\/(guides|components)\/([\w-]+)\.mdx$/;

function link(name: string, locale: string, slug: string): Node {
  return {
    type: 'element',
    tagName: 'a',
    properties: { href: `/${locale}/components/${slug}/`, className: ['symbol-link'] },
    children: [{ type: 'text', value: name }],
  };
}

function split(value: string, pattern: RegExp, target: (name: string) => Node | null): Node[] {
  const parts: Node[] = [];
  let last = 0;

  for (const match of value.matchAll(pattern)) {
    const node = target(match[0]);
    if (node === null) continue;

    if (match.index > last) parts.push({ type: 'text', value: value.slice(last, match.index) });
    parts.push(node);
    last = match.index + match[0].length;
  }

  if (parts.length === 0) return [];
  if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });

  return parts;
}

export function rehypeSymbolLinks(symbols: Map<string, string>): Plugin<[], Node> {
  const names = [...symbols.keys()].sort((a, b) => b.length - a.length);

  return () => (tree: Node, file: File) => {
    if (names.length === 0) return;

    const source = SOURCE.exec(file.path ?? '');
    const locale = source?.[1] ?? 'en';
    const current = source?.[2] === 'components' ? (source[3] ?? null) : null;

    const pattern = new RegExp(`\\b(?:${names.join('|')})\\b`, 'g');

    const target = (name: string): Node | null => {
      const slug = symbols.get(name);
      return slug === undefined || slug === current ? null : link(name, locale, slug);
    };

    const walk = (node: Node): void => {
      if (node.children === undefined) return;

      const replaced: Node[] = [];
      let changed = false;

      for (const child of node.children) {
        if (child.type === 'text') {
          const parts = split(child.value ?? '', pattern, target);
          if (parts.length > 0) {
            replaced.push(...parts);
            changed = true;
            continue;
          }
        } else {
          walk(child);
        }
        replaced.push(child);
      }

      if (changed) node.children = replaced;
    };

    // Samples only. Inline code carries the name in running prose, where a link on every mention
    // is noise rather than navigation.
    const find = (node: Node): void => {
      if (node.type === 'element' && node.tagName === 'pre') {
        walk(node);
        return;
      }
      for (const child of node.children ?? []) find(child);
    };

    find(tree);
  };
}
