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

// Minimal shapes for the two node kinds this file walks. The full hast types are not worth a
// dependency for a plugin this size.
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

  // The anchor `rehype-autolink-headings` appends is decorative, and its content would otherwise
  // end up in the table of contents.
  if (node.type === 'element' && (node as HastElement).tagName === 'a') {
    const properties = (node as HastElement).properties ?? {};
    if (properties['ariaHidden'] === 'true' || properties['aria-hidden'] === 'true') return '';
  }

  return ((node as { children?: HastNode[] }).children ?? []).map(textOf).join('');
}

/*
 * Collects the headings for the table of contents from the tree, after `rehype-slug` has run.
 *
 * Reading the ids from the tree rather than re-slugging the source text is the point: the contents
 * cannot drift from the anchors, including when two headings share a title and the slugger
 * disambiguates the second one.
 */
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
      /*
       * `next-mdx-remote` strips JavaScript expressions from MDX by default, because its usual job
       * is rendering MDX that arrived from a CMS or a user. Ours is neither: the guides live in
       * this repository and go through review like the code around them.
       *
       * Leaving the default on is not the safe choice here, it is the quiet wrong one. A prop
       * written as an expression — `include={['--kreo-surface-']}` — is removed silently, so a
       * token table asks for six tokens, receives no filter at all, and renders all 135 without
       * anything failing. String props survive, which is what makes it look like it works.
       */
      blockJS: false,
      // Frontmatter is stripped before this point by `lib/content.ts`, which needs it for the
      // navigation tree long before the page is rendered.
      mdxOptions: {
        /*
         * Without this the source is compiled as Markdown, not MDX, and the difference is quiet:
         * a component still renders, string props still arrive, and every prop written as an
         * expression — `include={[…]}` — is dropped on the floor. A token table then lists every
         * token in the library instead of the six it asked for, and nothing fails.
         */
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
                // Decorative, and it was turning up at the front of search excerpts as a stray `#`.
                'data-pagefind-ignore': true,
              },
              content: { type: 'text', value: '#' },
            },
          ],
          // Highlighting happens here, at build time, and not lazily in the browser. The plan
          // called for lazy loading because it assumed a runtime; a static export has no reason to
          // ship a highlighter to the reader at all.
          [
            rehypeShiki,
            {
              /*
               * The high-contrast pair, not the plain one. `github-light` paints constants in
               * `#E36209`, which is 3.48:1 on white — axe found it on the guide pages, and at
               * 12px it is text, not decoration, so 4.5:1 is the bar it has to clear. GitHub
               * publishes these two exactly for that, so the fix is a theme name rather than a
               * list of token colours this repository would then own.
               */
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
