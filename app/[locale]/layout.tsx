import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

// Order matters and is not alphabetical. `layers.css` declares the layer order and must come
// first; `library.css` pulls the library into the `library` layer; the site's own sheets follow.
// Anything imported ahead of `layers.css` would register its layers first and reorder the rest.
import '@/styles/layers.css';
import '@/styles/library.css';
import '@/styles/base.css';
import '@/styles/shell.css';
import '@/styles/docs.css';
import '@/styles/mobile.css';

import { Header } from '@/components/shell/Header';
import type { NavGroupData } from '@/components/shell/NavTree';
import { getNavTree } from '@/lib/nav';
import { dictionary, isLocale, locales, type Locale } from '@/lib/i18n';

/*
 * The library bundles Inter and nothing else — it has no monospace family, deliberately, because a
 * component library has nothing to set in one. Code blocks do, so the site brings its own. This is
 * a decision of the site, not a token of the library.
 *
 * Loaded through `next/font`, which self-hosts the files and emits the `@font-face` rules with the
 * metrics already in them, so there is no layout shift when the face arrives and no request to a
 * third party.
 */
const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--site-font-mono',
});

// There is no `app/layout.tsx`: with every route under `[locale]`, this is the root layout, and it
// is what lets `<html lang>` follow the locale instead of being frozen at build time.

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

// `output: 'export'` cannot render a locale that was not generated, so anything outside the list
// is a 404 rather than a runtime fallback.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = dictionary[locale];
  return {
    title: { default: t.siteTitle, template: `%s — ${t.siteTitle}` },
    description: t.siteTagline,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];

  /*
   * The tree is loaded here rather than in the documentation layout, because the drawer lives in
   * the header and the header is on every page. On a phone that is the only navigation there is,
   * so withholding it from the landing page would be withholding it from the whole site.
   */
  const tree = await getNavTree(locale);
  const groups: NavGroupData[] = tree.map((group) => ({
    id: group.id,
    label: t.groups[group.id],
    items: group.items.map(({ slug, title }) => ({ slug, title })),
  }));

  return (
    <html lang={locale} className={mono.variable}>
      <body>
        {/* First in the tab order, visible on focus, and pointing at the landmark below. */}
        <a className="skip-link" href="#content">
          {t.skipToContent}
        </a>

        <Header locale={locale} groups={groups} />

        {/*
          One `main` for the whole site, so every page has the landmark and none of them has two.
          `tabIndex={-1}` is what makes the skip link actually move focus rather than only move the
          viewport: without it the anchor scrolls, and the next Tab carries on from the header.
        */}
        <main id="content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
