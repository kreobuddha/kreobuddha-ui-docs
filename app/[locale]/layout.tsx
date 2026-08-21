import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

import '@/styles/layers.css';
import '@/styles/library.css';
import '@/styles/base.css';
import '@/styles/shell.css';
import '@/styles/docs.css';
import '@/styles/components-page.css';
import '@/styles/theme.css';
import '@/styles/search.css';
import '@/styles/landing.css';
import '@/styles/mobile.css';

import { ThemeScript } from '@/components/theme/ThemeScript';
import { Header } from '@/components/shell/Header';
import type { NavGroupData } from '@/components/shell/NavTree';
import { getNavTree } from '@/lib/nav';
import { asset, basePath, localeAlternates, siteUrl } from '@/lib/links';
import { resolveTokenValue } from '@/lib/theme';
import { tokenMaps } from '@/lib/tokens';
import { dictionary, isLocale, locales, type Locale } from '@/lib/i18n';

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--site-font-mono',
});

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

async function pageColours(): Promise<{ light: string; dark: string }> {
  const { light, dark } = await tokenMaps();
  return {
    light: resolveTokenValue(light, '--kreo-surface-page') ?? '#ffffff',
    dark: resolveTokenValue(dark, '--kreo-surface-page') ?? '#000000',
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { light } = await pageColours();
  return { themeColor: light };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = dictionary[locale];

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.siteTitle, template: `%s — ${t.siteTitle}` },
    description: t.siteTagline,
    alternates: { canonical: `${basePath}/${locale}/`, languages: localeAlternates() },
    icons: { icon: [{ url: asset('/icon.svg'), type: 'image/svg+xml' }] },
    openGraph: {
      type: 'website',
      siteName: t.siteTitle,
      locale,
      title: t.siteTitle,
      description: t.siteTagline,
    },
    twitter: { card: 'summary' },
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

  const [tree, colours] = await Promise.all([getNavTree(locale), pageColours()]);
  const groups: NavGroupData[] = tree.map((group) => ({
    id: group.id,
    label: t.groups[group.id],
    items: group.items,
  }));

  return (
    <html lang={locale} className={mono.variable}>
      <body>
        <ThemeScript light={colours.light} dark={colours.dark} />

        <a className="skip-link" href="#content">
          {t.skipToContent}
        </a>

        <Header locale={locale} groups={groups} colours={colours} />

        <main id="content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
