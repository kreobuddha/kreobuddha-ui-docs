import { useTranslation } from 'react-i18next';

import Meta from '@components/Meta/Meta';
import Breadcrumbs from '@components/Breadcrumbs/Breadcrumbs';
import CodeBlock from '@components/CodeBlock/CodeBlock';
import Playground from '@components/Playground/Playground';
import PrevNext from '@components/PrevNext/PrevNext';
import ProseLink from '@components/ProseLink/ProseLink';
import PropsTable, { type PropRow } from '@components/PropsTable/PropsTable';
import Toc from '@components/Toc/Toc';
import TokenTable from '@components/TokenTable/TokenTable';
import { docHref, type DocMeta, type DocModule } from '@utils/content';
import { getNeighbours } from '@utils/nav';
import { route } from '@utils/links';
import type { Locale } from '@utils/i18n';

const Doc = ({
  locale,
  meta,
  module,
}: {
  locale: Locale;
  meta: DocMeta;
  module: DocModule;
}) => {
  const { t } = useTranslation();

  const Content = module.default;
  const isGuide = meta.collection === 'guides';
  const path = isGuide ? `/docs/${meta.slug}` : `/components/${meta.slug}`;

  const components = {
    a: ProseLink,
    pre: CodeBlock,
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
};

export default Doc;
