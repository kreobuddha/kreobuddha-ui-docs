import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { Playground } from '@/components/docs/Playground';
import { PrevNext } from '@/components/docs/PrevNext';
import { PropsTable, type PropRow } from '@/components/docs/PropsTable';
import { Toc } from '@/components/docs/Toc';
import { allComponentParams, docHref, getDoc } from '@/lib/content';
import { dictionary, isLocale, type Locale } from '@/lib/i18n';
import { route } from '@/lib/links';
import { renderGuide } from '@/lib/mdx';
import { getNeighbours } from '@/lib/nav';

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ locale: Locale; component: string }[]> {
  return allComponentParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; component: string }>;
}): Promise<Metadata> {
  const { locale, component } = await params;
  if (!isLocale(locale)) return {};

  const doc = await getDoc('components', locale, component);
  if (!doc) return {};

  return { title: doc.title, description: doc.description };
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ locale: string; component: string }>;
}) {
  const { locale, component } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];
  const doc = await getDoc('components', locale, component);
  if (!doc) notFound();

  /*
   * The components a component page may use. `PropsTable` is bound to the locale here rather than
   * in the MDX, so a page written in Russian gets Russian column headings without every table in
   * the file having to say so.
   */
  const mdxComponents = {
    PropsTable: (props: { rows: PropRow[] }) => <PropsTable {...props} locale={locale} />,
    Playground: (props: { id: string }) => (
      <Playground {...props} label={t.playground} codeLabel={t.playgroundCode} />
    ),
  };

  const { content, headings } = await renderGuide(doc.source, mdxComponents);
  const { previous, next } = await getNeighbours(locale, docHref('components', locale, doc.slug));

  return (
    <div className="guide">
      <article className="prose">
        <Breadcrumbs
          locale={locale}
          trail={[
            { label: t.componentsTitle, href: route(locale, '/components') },
            { label: doc.title },
          ]}
        />

        <h1>{doc.title}</h1>

        {doc.isFallback ? (
          <aside className="fallback-notice" lang={locale}>
            <strong>{t.fallbackTitle}</strong> {t.fallbackBody}
          </aside>
        ) : null}

        <div className="prose__body" lang={doc.locale}>
          {content}
        </div>

        <PrevNext locale={locale} previous={previous} next={next} />
      </article>

      <Toc headings={headings} label={t.onThisPage} />
    </div>
  );
}
