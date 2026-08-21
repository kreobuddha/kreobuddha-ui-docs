'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { asset } from '@/lib/links';

export interface PaletteLabels {
  open: string;
  title: string;
  placeholder: string;
  empty: string;
  searching: string;
  results: string;
  shortcutHint: string;
  close: string;
}

interface Hit {
  id: string;
  url: string;
  title: string;
  excerpt: string;
}

interface PagefindResult {
  id: string;
  data: () => Promise<{ url: string; excerpt: string; meta?: { title?: string } }>;
}

interface Pagefind {
  options?: (options: Record<string, unknown>) => Promise<void>;
  search: (
    term: string,
    options?: { filters?: Record<string, string[]> },
  ) => Promise<{ results: PagefindResult[] }>;
}

const MAX_RESULTS = 8;

export function CommandPalette({ locale, labels }: { locale: Locale; labels: PaletteLabels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const engine = useRef<Pagefind | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<'idle' | 'searching' | 'ready'>('idle');

  const open = useCallback(() => {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement ? active : null;

    dialog.current?.showModal();
    input.current?.focus();
  }, []);

  const close = useCallback(() => {
    dialog.current?.close();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (dialog.current?.open) close();
      else open();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const load = useCallback(async (): Promise<Pagefind | null> => {
    if (engine.current) return engine.current;

    try {
      const module = (await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */
        asset('/pagefind/pagefind.js')
      )) as unknown as Pagefind;

      await module.options?.({ excerptLength: 20 });
      engine.current = module;
      return module;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term === '') {
      setHits([]);
      setState('idle');
      return;
    }

    let cancelled = false;
    setState('searching');

    const run = async () => {
      const pagefind = await load();
      if (!pagefind || cancelled) return;

      const search = await pagefind.search(term, { filters: { locale: [locale] } });
      const found = await Promise.all(
        search.results.slice(0, MAX_RESULTS).map(async (result) => {
          const data = await result.data();
          return {
            id: result.id,
            url: data.url,
            title: data.meta?.title ?? data.url,
            excerpt: data.excerpt,
          };
        }),
      );

      if (cancelled) return;
      setHits(found);
      setActive(0);
      setState('ready');
    };

    const timer = setTimeout(() => void run(), 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, locale, load]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (hits.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => (current + 1) % hits.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (current - 1 + hits.length) % hits.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(hits.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = hits[active];
      if (hit) window.location.assign(hit.url);
    }
  };

  const listId = 'command-palette-results';
  const optionId = (index: number) => `${listId}-${index}`;

  return (
    <>
      <button type="button" className="palette-trigger" onClick={open}>
        <svg className="palette-trigger__glyph" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <span className="palette-trigger__label">{labels.open}</span>
        <kbd>{labels.shortcutHint}</kbd>
      </button>

      <dialog
        className="palette"
        ref={dialog}
        aria-label={labels.title}
        onClose={() => {
          setQuery('');
          setHits([]);
          setState('idle');
          opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <div className="palette__panel">
          <input
            ref={input}
            type="text"
            className="palette__input"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls={listId}
            aria-activedescendant={hits.length > 0 ? optionId(active) : undefined}
            aria-autocomplete="list"
            placeholder={labels.placeholder}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={onKeyDown}
          />

          <ul className="palette__results" id={listId} role="listbox" aria-label={labels.title}>
            {hits.map((hit, index) => (
              <li key={hit.id} role="presentation" onMouseEnter={() => setActive(index)}>
                <a
                  href={hit.url}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                >
                  <strong>{hit.title}</strong>
                  <span dangerouslySetInnerHTML={{ __html: hit.excerpt }} />
                </a>
              </li>
            ))}
          </ul>

          <p className="palette__status" role="status">
            {state === 'searching'
              ? labels.searching
              : state === 'ready'
                ? hits.length === 0
                  ? labels.empty
                  : labels.results.replace('{count}', String(hits.length))
                : ''}
          </p>
        </div>
      </dialog>
    </>
  );
}
