import { copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import rehypeShiki from '@shikijs/rehype';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';

import { rehypeHeadings } from './plugins/rehype-headings';
import { content } from './plugins/content';
import { tokens } from './plugins/tokens';

const BASE = `${(process.env.VITE_BASE_PATH ?? '/').replace(/\/+$/, '')}/`;

let manifest: Record<string, { file: string }> | null = null;

function readManifest(): Record<string, { file: string }> {
  manifest ??= JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<
    string,
    { file: string }
  >;
  return manifest;
}

function hydrationChunk(): string | null {
  return readManifest()['node_modules/react-dom/client.js']?.file ?? null;
}

function chunkFor(route: string): string | null {
  const match = /^\/(en|ru)\/(docs|components)\/([\w-]+)\/?$/.exec(route);
  if (!match) return null;

  const [, locale, section, slug] = match;
  const source = `content/${locale}/${section === 'docs' ? 'guides' : 'components'}/${slug}.mdx`;

  return readManifest()[source]?.file ?? null;
}

export default defineConfig({
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'none',
    // Pages serves dist/404.html for anything it cannot find, and only from the root.
    onFinished: () => copyFileSync('dist/404/index.html', 'dist/404.html'),

    // Without this the browser runs the app chunk, discovers the page's own chunk, and only then
    // hydrates - long enough for a click on a freshly loaded page to be lost.
    onPageRendered: (route: string, html: string) => {
      const preloads = [hydrationChunk(), chunkFor(route)]
        .filter((chunk): chunk is string => chunk !== null)
        .map((chunk) => `<link rel="modulepreload" href="${BASE}${chunk}">`)
        .join('');

      return preloads === '' ? html : html.replace('</head>', `${preloads}</head>`);
    },
  },

  base: BASE,

  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },

  build: { manifest: true },

  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm, remarkFrontmatter, [remarkMdxFrontmatter, { name: 'meta' }]],
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
              themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
              defaultColor: 'light',
            },
          ],
          rehypeHeadings,
        ],
      }),
    },
    react(),
    tokens(),
    content(),
  ],
});
