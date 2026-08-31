import './PageActions.css';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { docHref, type Collection } from '@utils/content';
import type { Locale } from '@utils/i18n';
import { basePath, siteUrl } from '@utils/links';

const REPOSITORY = 'https://github.com/kreobuddha/kreobuddha-ui-docs';
const QUOTE_LIMIT = 500;

interface Page {
  locale: Locale;
  collection: Collection;
  slug: string;
  title: string;
}

function reportUrl({ locale, collection, slug, title }: Page, quote: string): string {
  const source = `content/${locale}/${collection}/${slug}.mdx`;

  const body = [
    `**Page:** ${siteUrl}${basePath}${docHref(collection, locale, slug)}`,
    `**Source:** \`${source}\``,
    `**Language:** ${locale}`,
    `**@kreobuddha/ui:** ${__LIBRARY_VERSION__}`,
    '',
    ...(quote === '' ? [] : [`> ${quote.replace(/\n+/g, '\n> ')}`, '']),
    '**What is wrong:**',
    '',
  ].join('\n');

  return `${REPOSITORY}/issues/new?${new URLSearchParams({
    title: `Docs: ${title}`,
    body,
    labels: 'documentation',
  }).toString()}`;
}

const PageActions = ({ page, updated }: { page: Page; updated: string | null }) => {
  const { t, i18n } = useTranslation();
  const [quote, setQuote] = useState('');

  // Watching the selection rather than the link: hovering it is not the only way to reach it, and
  // a keyboard reader never hovers anything at all.
  useEffect(() => {
    const onSelect = () => {
      setQuote((window.getSelection()?.toString().trim() ?? '').slice(0, QUOTE_LIMIT));
    };

    document.addEventListener('selectionchange', onSelect);
    return () => document.removeEventListener('selectionchange', onSelect);
  }, []);

  // Selecting the wrong sentence and pressing a key beats finding the report link, opening it, and
  // then typing out where the wrong sentence was.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;

      if (quote === '') return;

      event.preventDefault();
      window.open(reportUrl(page, quote), '_blank', 'noopener');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [page, quote]);

  const stamp =
    updated === null
      ? null
      : new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(updated));

  return (
    <footer className="page-actions" data-pagefind-ignore>
      {stamp === null ? null : (
        <p className="page-actions__updated">
          {t('pageUpdated')} <time dateTime={updated ?? undefined}>{stamp}</time>
        </p>
      )}

      <p className="page-actions__links">
        <a
          href={`${REPOSITORY}/edit/master/content/${page.locale}/${page.collection}/${page.slug}.mdx`}
          target="_blank"
          rel="noreferrer"
        >
          {t('pageEdit')}
        </a>

        <a
          href={reportUrl(page, quote)}
          target="_blank"
          rel="noreferrer"
        >
          {t('pageReport')}
        </a>
      </p>
    </footer>
  );
};

export default PageActions;
