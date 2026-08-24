import { copyFileSync, readFileSync } from 'node:fs';

import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import rehypeShiki from '@shikijs/rehype';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';

import { rehypeHeadings } from './script/rehype-headings.ts';
import { content } from './script/content.ts';
import { sitemap } from './script/sitemap.ts';
import { tokens } from './script/tokens.ts';

const BASE = `${(process.env.VITE_BASE_PATH ?? '/').replace(/\/+$/, '')}/`;
const ORIGIN = process.env.VITE_SITE_URL ?? 'https://kreobuddha.github.io';

let manifest: Record<string, { file: string }> | null = null;

function readManifest(): Record<string, { file: string }> {
  manifest ??= JSON.parse(readFileSync('build/.vite/manifest.json', 'utf8')) as Record<
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
    // Pages serves build/404.html for anything it cannot find, and only from the root.
    onFinished: () => {
      copyFileSync('build/404/index.html', 'build/404.html');
      sitemap(ORIGIN, BASE).write('build');
    },

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

  resolve: { tsconfigPaths: true },

  build: { manifest: true, outDir: 'build' },

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
