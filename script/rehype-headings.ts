import type { Plugin } from 'unified';

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

interface Node {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
}

function textOf(node: Node): string {
  if (node.type === 'text') return node.value ?? '';

  if (node.type === 'element' && node.tagName === 'a') {
    const properties = node.properties ?? {};
    if (properties['ariaHidden'] === 'true' || properties['aria-hidden'] === 'true') return '';
  }

  return (node.children ?? []).map(textOf).join('');
}

export const rehypeHeadings: Plugin<[], Node> = () => (tree: Node) => {
  const headings: Heading[] = [];

  const walk = (node: Node): void => {
    if (node.type === 'element') {
      const depth = node.tagName === 'h2' ? 2 : node.tagName === 'h3' ? 3 : null;
      const id = node.properties?.['id'];
      if (depth !== null && typeof id === 'string') {
        headings.push({ id, depth, text: textOf(node).trim() });
      }
    }
    for (const child of node.children ?? []) walk(child);
  };

  walk(tree);

  tree.children = [
    ...(tree.children ?? []),
    {
      type: 'mdxjsEsm',
      value: '',
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              specifiers: [],
              source: null,
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [
                  {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'headings' },
                    init: valueToEstree(headings),
                  },
                ],
              },
            },
          ],
        },
      },
    } as unknown as Node,
  ];
};

function valueToEstree(value: unknown): unknown {
  if (Array.isArray(value)) {
    return { type: 'ArrayExpression', elements: value.map(valueToEstree) };
  }
  if (value !== null && typeof value === 'object') {
    return {
      type: 'ObjectExpression',
      properties: Object.entries(value).map(([key, item]) => ({
        type: 'Property',
        kind: 'init',
        method: false,
        shorthand: false,
        computed: false,
        key: { type: 'Literal', value: key },
        value: valueToEstree(item),
      })),
    };
  }
  return { type: 'Literal', value };
}
