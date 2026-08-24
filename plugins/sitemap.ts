import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readEntries } from './content.ts';

const LOCALES = ['en', 'ru'] as const;

function pathsFor(): string[] {
  const entries = readEntries();
  const paths = new Set<string>(['/']);

  for (const locale of LOCALES) {
    paths.add(`/${locale}/`);
    paths.add(`/${locale}/docs/`);
    paths.add(`/${locale}/components/`);
    paths.add(`/${locale}/tokens/`);
  }

  for (const entry of entries) {
    const section = entry.collection === 'guides' ? 'docs' : 'components';
    paths.add(`/${entry.locale}/${section}/${entry.slug}/`);
  }

  return [...paths].sort();
}

function alternatesFor(path: string, origin: string, base: string): string {
  const match = /^\/(en|ru)(\/.*)?$/.exec(path);
  if (!match) return '';

  const [, , rest = '/'] = match;
  return LOCALES.map(
    (locale) =>
      `\n    <xhtml:link rel="alternate" hreflang="${locale}" href="${origin}${base}${locale}${rest}"/>`,
  ).join('');
}

export function sitemap(origin: string, base: string) {
  return {
    name: 'kreobuddha-sitemap',

    write(outDir: string) {
      const urls = pathsFor()
        .map((path) => {
          const location = `${origin}${base}${path.replace(/^\//, '')}`;
          return `  <url>\n    <loc>${location}</loc>${alternatesFor(path, origin, base)}\n  </url>`;
        })
        .join('\n');

      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
      );

      writeFileSync(
        join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}sitemap.xml\n`,
      );
    },
  };
}
