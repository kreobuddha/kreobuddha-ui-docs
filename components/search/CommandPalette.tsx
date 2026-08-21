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
  /*
   * A template with `{count}` in it rather than a function. A server component cannot hand a
   * function to a client one, and the substitution is the client's job anyway — it is the only
   * side that knows the number.
   */
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

/* The shape of the parts of Pagefind's API this uses. It is loaded at runtime, not built with the
 * site, so there are no types to import — only the contract the palette depends on. */
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
    /*
     * Whatever had focus when the palette was asked for gets it back when the palette goes. A
     * dialog returns focus to its trigger on its own, but this one is usually opened from a
     * keyboard shortcut with focus somewhere in the page — and dropping someone back at the top of
     * the document because they pressed Escape is how a shortcut becomes a thing people avoid.
     */
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement ? active : null;

    dialog.current?.showModal();
    input.current?.focus();
  }, []);

  const close = useCallback(() => {
    dialog.current?.close();
  }, []);

  // The shortcut every application of this kind uses, and the reason the palette exists at all.
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

  /*
   * Pagefind is fetched the first time the palette is opened, never at load.
   *
   * The index and the runtime together are the largest thing on the site, and a reader who never
   * searches should not pay for it. The path is built rather than imported: it is written by the
   * build after the bundler has finished, so the bundler must not try to resolve it.
   */
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
      // No index — a development server, or a build that skipped it. The palette says nothing
      // rather than throwing an error at someone who only pressed a shortcut.
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
            // Pagefind indexes the exported directory, so its urls start at the site root and know
            // nothing about the sub-path the site is served from.
            url: asset(data.url),
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

    // A keystroke is not a query. Waiting a moment keeps a fast typist from firing eight searches.
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
        {/* Drawn here rather than fetched: one icon is not worth a request or a dependency. */}
        <svg className="palette-trigger__glyph" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/*
          The word is hidden by the stylesheet where there is no room for it, not removed: it is
          the button's accessible name, and a magnifying glass on its own is a guess.
        */}
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
          {/*
            A combobox, spelled out: the input keeps focus while the arrows move through the list,
            and `aria-activedescendant` is what tells a screen reader which row is current. Moving
            real focus into the list instead would take it out of the field being typed into.
          */}
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
              /*
               * The option is the link, not a wrapper around one.
               *
               * An `<a>` nested inside `role="option"` is two interactive things where the pattern
               * allows one, and axe flags it `nested-interactive`. Putting the role on the anchor
               * keeps a real link — middle-click, open in a new tab, the status bar showing where
               * it goes — while the listbox sees exactly one option per row.
               *
               * `tabIndex={-1}` stays: focus belongs in the field being typed into, and the arrows
               * move `aria-activedescendant` rather than focus.
               */
              <li key={hit.id} role="presentation" onMouseEnter={() => setActive(index)}>
                <a
                  href={hit.url}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                >
                  <strong>{hit.title}</strong>
                  {/* Pagefind marks the matched words; it is its own HTML, not the page's. */}
                  <span dangerouslySetInnerHTML={{ __html: hit.excerpt }} />
                </a>
              </li>
            ))}
          </ul>

          {/*
            Results arrive after the typing has stopped, so a screen reader is told how many there
            are rather than left to arrow into silence.
          */}
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
