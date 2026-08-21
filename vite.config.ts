import { copyFileSync } from 'node:fs';
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

export default defineConfig({
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'none',
    // Pages serves dist/404.html for anything it cannot find, and only from the root.
    onFinished: () => copyFileSync('dist/404/index.html', 'dist/404.html'),
  },

  base: `${(process.env.VITE_BASE_PATH ?? '/').replace(/\/+$/, '')}/`,

  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },

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
