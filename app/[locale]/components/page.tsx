import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { docHref, getDocs } from '@/lib/content';
import { dictionary, isLocale, locales, type Locale } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = dictionary[locale];
  return { title: t.componentsTitle, description: t.componentsIndexLead };
}

export default async function ComponentsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];
  const components = (await getDocs('components', locale)).sort((a, b) => a.order - b.order);

  return (
    <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
      <Breadcrumbs locale={locale} trail={[{ label: t.componentsTitle }]} />
      <h1>{t.componentsTitle}</h1>
      <p className="lead">{t.componentsIndexLead}</p>

      {/*
        Only the components this site actually documents are listed. A page that exists but says
        nothing is worse than an absence: the absence is honest.
      */}
      <ul className="guide-index">
        {components.map((component) => (
          <li key={component.slug}>
            <Link href={docHref('components', locale, component.slug)}>{component.title}</Link>
            <p>{component.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
