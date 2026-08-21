import type { MDXComponents } from 'mdx/types';

import rehypeShiki from '@shikijs/rehype';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

interface HastText {
  type: 'text';
  value: string;
}

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

type HastNode = HastText | HastElement | { type: string; children?: HastNode[] };

function textOf(node: HastNode): string {
  if (node.type === 'text') return (node as HastText).value;

  if (node.type === 'element' && (node as HastElement).tagName === 'a') {
    const properties = (node as HastElement).properties ?? {};
    if (properties['ariaHidden'] === 'true' || properties['aria-hidden'] === 'true') return '';
  }

  return ((node as { children?: HastNode[] }).children ?? []).map(textOf).join('');
}

function rehypeCollectHeadings(collected: Heading[]) {
  return () => (tree: HastNode) => {
    const walk = (node: HastNode): void => {
      if (node.type === 'element') {
        const element = node as HastElement;
        const depth = element.tagName === 'h2' ? 2 : element.tagName === 'h3' ? 3 : null;
        const id = element.properties?.['id'];

        if (depth !== null && typeof id === 'string') {
          collected.push({ id, depth, text: textOf(element).trim() });
        }
      }

      for (const child of (node as { children?: HastNode[] }).children ?? []) walk(child);
    };

    walk(tree);
  };
}

export interface RenderedGuide {
  content: React.ReactElement;
  headings: Heading[];
}

export async function renderGuide(
  source: string,
  components: MDXComponents = {},
): Promise<RenderedGuide> {
  const headings: Heading[] = [];

  const { content } = await compileMDX({
    source,
    components,
    options: {
      blockJS: false,
      mdxOptions: {
        format: 'mdx',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: 'heading-anchor',
                ariaHidden: 'true',
                tabIndex: -1,
                'data-pagefind-ignore': true,
              },
              content: { type: 'text', value: '#' },
            },
          ],
          [
            rehypeShiki,
            {
              themes: {
                light: 'github-light-high-contrast',
                dark: 'github-dark-high-contrast',
              },
              defaultColor: 'light',
            },
          ],
          rehypeCollectHeadings(headings),
        ],
      },
    },
  });

  return { content, headings };
}
