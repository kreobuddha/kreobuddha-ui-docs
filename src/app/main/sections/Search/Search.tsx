import './Search.css';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import Meta from '@components/Meta/Meta';
import Breadcrumbs from '@components/Breadcrumbs/Breadcrumbs';
import type { Locale } from '@utils/i18n';
import { route } from '@utils/links';
import {
  isSection,
  routerPath,
  search,
  sections,
  type Outcome,
  type Section,
} from '@utils/pagefind';

const PER_PAGE = 10;

const Search = ({ locale }: { locale: Locale }) => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const query = params.get('q') ?? '';
  const raw = params.get('section');
  const section = isSection(raw) ? raw : undefined;
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [term, setTerm] = useState(query);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [state, setState] = useState<'idle' | 'searching' | 'ready' | 'unavailable'>('idle');

  const label = useMemo(
    () => ({
      guides: t('docsTitle'),
      components: t('componentsTitle'),
      tokens: t('tokensTitle'),
    }),
    [t],
  );

  // The address bar is the state. Typing writes to it and the search reads from it, so a result
  // list can be sent to someone else and the back button walks the queries a reader actually made.
  useEffect(() => {
    if (term === query) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (term === '') next.delete('q');
      else next.set('q', term);
      next.delete('page');
      setParams(next, { replace: true });
    }, 200);

    return () => clearTimeout(timer);
  }, [term, query, params, setParams]);

  useEffect(() => setTerm(query), [query]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === '') {
      setOutcome(null);
      setState('idle');
      return;
    }

    let cancelled = false;
    setState('searching');

    void (async () => {
      const found = await search(trimmed, {
        locale,
        section,
        offset: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      });

      if (cancelled) return;
      setOutcome(found);
      // A search engine that did not load is not a search that found nothing, and telling a reader
      // the second when the first happened sends them off to rewrite a query that was fine.
      setState(found === null ? 'unavailable' : 'ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [query, section, page, locale]);

  const move = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next);
  };

  const total = outcome?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <article className="prose search" data-pagefind-ignore>
      <Meta
        title={t('searchTitle')}
        description={t('searchPlaceholder')}
        locale={locale}
        path="/search"
        siteTitle={t('siteTitle')}
      />

      <Breadcrumbs locale={locale} trail={[{ label: t('searchTitle') }]} />

      <h1>{t('searchTitle')}</h1>

      <form className="search__form" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="search__label" htmlFor="search-query">
          {t('searchPlaceholder')}
        </label>
        <input
          id="search-query"
          className="search__input"
          type="search"
          autoComplete="off"
          placeholder={t('searchPlaceholder')}
          value={term}
          onChange={(event) => setTerm(event.currentTarget.value)}
        />
      </form>

      {state === 'idle' ? null : (
        <div className="search__facets" role="group" aria-label={t('searchSection')}>
          <button
            type="button"
            className="search__facet"
            aria-pressed={section === undefined}
            onClick={() => move({ section: null, page: null })}
          >
            {t('searchAll')}
          </button>

          {sections.map((name: Section) => (
            <button
              key={name}
              type="button"
              className="search__facet"
              aria-pressed={section === name}
              onClick={() => move({ section: name, page: null })}
            >
              {label[name]}
              <span className="search__count">{outcome?.counts[name] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <p className="search__status" role="status">
        {state === 'searching'
          ? t('searching')
          : state === 'unavailable'
            ? t('searchUnavailable')
            : state === 'ready'
              ? total === 0
                ? t('searchEmpty')
                : t('searchResults').replace('{count}', String(total))
              : t('searchIdle')}
      </p>

      {outcome === null || outcome.hits.length === 0 ? null : (
        <ol className="search__results">
          {outcome.hits.map((hit) => (
            <li key={hit.id} className="search__result">
              <h2 className="search__result-title">
                <Link to={routerPath(hit.url)}>{hit.title}</Link>
              </h2>
              <p
                className="search__excerpt"
                dangerouslySetInnerHTML={{ __html: hit.excerpt }}
              />
            </li>
          ))}
        </ol>
      )}

      {pages < 2 ? null : (
        <nav className="search__pages" aria-label={t('searchPages')}>
          <button
            type="button"
            className="search__page"
            disabled={page <= 1}
            onClick={() => move({ page: String(page - 1) })}
          >
            {t('previous')}
          </button>

          <span className="search__page-of">
            {t('searchPageOf').replace('{page}', String(page)).replace('{pages}', String(pages))}
          </span>

          <button
            type="button"
            className="search__page"
            disabled={page >= pages}
            onClick={() => move({ page: String(page + 1) })}
          >
            {t('next')}
          </button>
        </nav>
      )}

      <p className="search__back">
        <Link to={route(locale, '/docs')}>{t('docsTitle')}</Link>
      </p>
    </article>
  );
};

export default Search;
