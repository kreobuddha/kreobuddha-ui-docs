import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Order matters and is not alphabetical. `layers.css` declares the layer order and must come
// first; `library.css` pulls the library into the `library` layer; the site's own sheets follow.
// Anything imported ahead of `layers.css` would register its layers first and reorder the rest.
import '@/styles/layers.css';
import '@/styles/library.css';
import '@/styles/base.css';
import '@/styles/preview.css';

import { dictionary, isLocale, locales, type Locale } from '@/lib/i18n';

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
    title: t.title,
    description: t.tagline,
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

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
