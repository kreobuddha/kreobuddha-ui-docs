import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { PrevNext } from '@/components/docs/PrevNext';
import { Toc } from '@/components/docs/Toc';
import { TokenTable } from '@/components/docs/TokenTable';
import { allGuideParams, getDoc, getDocs } from '@/lib/content';
import { dictionary, isLocale, type Locale } from '@/lib/i18n';
import { basePath, localeAlternates, route } from '@/lib/links';
import { renderGuide } from '@/lib/mdx';
import { getNeighbours } from '@/lib/nav';

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ locale: Locale; slug: string[] }[]> {
  return allGuideParams();
}

const mdxComponents = { TokenTable };

function slugOf(slug: string[] | undefined): string | null {
  return slug === undefined || slug.length === 0 ? null : slug.join('/');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const t = dictionary[locale];
  const single = slugOf(slug);
  const path = single === null ? '/docs' : `/docs/${single}`;
  const alternates = {
    canonical: `${basePath}/${locale}${path}/`,
    languages: localeAlternates(path),
  };

  if (single === null) {
    return { title: t.docsTitle, description: t.guidesIndexLead, alternates };
  }

  const guide = await getDoc('guides', locale, single);
  if (!guide) return {};

  return { title: guide.title, description: guide.description, alternates };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];
  const single = slugOf(slug);

  if (single === null) {
    const guides = await getDocs('guides', locale);

    return (
      <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
        <Breadcrumbs locale={locale} trail={[{ label: t.docsTitle }]} />
        <h1>{t.docsTitle}</h1>
        <p className="lead">{t.guidesIndexLead}</p>

        {(['getting-started', 'foundations', 'patterns'] as const).map((group) => {
          const items = guides
            .filter((guide) => guide.group === group)
            .sort((a, b) => a.order - b.order);
          if (items.length === 0) return null;

          return (
            <section key={group}>
              <h2>{t.groups[group]}</h2>
              <ul className="guide-index">
                {items.map((guide) => (
                  <li key={guide.slug}>
                    <Link href={route(locale, `/docs/${guide.slug}`)}>{guide.title}</Link>
                    <p>{guide.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </article>
    );
  }

  const guide = await getDoc('guides', locale, single);
  if (!guide) notFound();

  const { content, headings } = await renderGuide(guide.source, mdxComponents);
  const { previous, next } = await getNeighbours(locale, route(locale, `/docs/${guide.slug}`));

  return (
    <div className="guide">
      <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
        <Breadcrumbs
          locale={locale}
          trail={[
            { label: t.docsTitle, href: route(locale, '/docs') },
            { label: guide.title },
          ]}
        />

        <h1>{guide.title}</h1>

        {guide.isFallback ? (
          <aside className="fallback-notice" lang={locale}>
            <strong>{t.fallbackTitle}</strong> {t.fallbackBody}
          </aside>
        ) : null}

        <div className="prose__body" lang={guide.locale}>
          {content}
        </div>

        <PrevNext locale={locale} previous={previous} next={next} />
      </article>

      <Toc headings={headings} label={t.onThisPage} />
    </div>
  );
}
