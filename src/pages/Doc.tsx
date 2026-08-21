import { useTranslation } from 'react-i18next';

import { Meta } from './Meta';
import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { Playground } from '@/components/docs/Playground';
import { PrevNext } from '@/components/docs/PrevNext';
import { PropsTable, type PropRow } from '@/components/docs/PropsTable';
import { Toc } from '@/components/docs/Toc';
import { TokenTable } from '@/components/docs/TokenTable';
import { docHref, type DocMeta, type DocModule } from '@/lib/content';
import { getNeighbours } from '@/lib/nav';
import { route } from '@/lib/links';
import type { Locale } from '@/lib/i18n';

export function Doc({
  locale,
  meta,
  module,
}: {
  locale: Locale;
  meta: DocMeta;
  module: DocModule;
}) {
  const { t } = useTranslation();

  const Content = module.default;
  const isGuide = meta.collection === 'guides';
  const path = isGuide ? `/docs/${meta.slug}` : `/components/${meta.slug}`;

  const components = {
    TokenTable,
    PropsTable: (props: { rows: PropRow[] }) => <PropsTable {...props} locale={locale} />,
    Playground: (props: { id: string }) => (
      <Playground {...props} label={t('playground')} codeLabel={t('playgroundCode')} />
    ),
  };

  const { previous, next } = getNeighbours(
    locale,
    t('tokensTitle'),
    docHref(meta.collection, locale, meta.slug),
  );

  const parent = isGuide
    ? { label: t('docsTitle'), href: route(locale, '/docs') }
    : { label: t('componentsTitle'), href: route(locale, '/components') };

  return (
    <div className="guide">
      <Meta
        title={meta.title}
        description={meta.description}
        locale={locale}
        path={path}
        siteTitle={t('siteTitle')}
      />

      <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
        <Breadcrumbs locale={locale} trail={[parent, { label: meta.title }]} />

        <h1>{meta.title}</h1>

        {meta.isFallback ? (
          <aside className="fallback-notice" lang={locale}>
            <strong>{t('fallbackTitle')}</strong> {t('fallbackBody')}
          </aside>
        ) : null}

        <div className="prose__body" lang={meta.locale}>
          <Content components={components} />
        </div>

        <PrevNext locale={locale} previous={previous} next={next} />
      </article>

      <Toc headings={module.headings} label={t('onThisPage')} />
    </div>
  );
}
