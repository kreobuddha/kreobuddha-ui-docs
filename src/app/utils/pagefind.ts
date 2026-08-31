import type { Locale } from './i18n';
import { asset, basePath } from './links';

export const sections = ['guides', 'components', 'tokens'] as const;

export type Section = (typeof sections)[number];

export function isSection(value: string | null): value is Section {
  return value !== null && (sections as readonly string[]).includes(value);
}

// Pagefind indexes the built files, so the urls it hands back already carry the base path, while
// a router Link adds it again from basename.
export function routerPath(url: string): string {
  return basePath !== '' && url.startsWith(basePath) ? (url.slice(basePath.length) ?? '/') : url;
}

export interface Hit {
  id: string;
  url: string;
  title: string;
  excerpt: string;
}

export interface Outcome {
  hits: Hit[];
  total: number;
  counts: Record<string, number>;
}

interface Result {
  id: string;
  data: () => Promise<{ url: string; excerpt: string; meta?: { title?: string } }>;
}

interface Search {
  results: Result[];
  filters?: Record<string, Record<string, number>>;
  totalFilters?: Record<string, Record<string, number>>;
}

interface Pagefind {
  options?: (options: Record<string, unknown>) => Promise<void>;
  search: (
    term: string,
    options?: { filters?: Record<string, string[]> },
  ) => Promise<Search>;
}

let engine: Pagefind | null = null;

export async function load(excerptLength: number): Promise<Pagefind | null> {
  if (engine) return engine;

  try {
    const module = (await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */
      asset('/pagefind/pagefind.js')
    )) as unknown as Pagefind;

    await module.options?.({ excerptLength });
    engine = module;
    return module;
  } catch {
    return null;
  }
}

export async function search(
  term: string,
  {
    locale,
    section,
    offset = 0,
    limit,
    excerptLength = 30,
  }: {
    locale: Locale;
    section?: Section | undefined;
    offset?: number;
    limit: number;
    excerptLength?: number;
  },
): Promise<Outcome | null> {
  const pagefind = await load(excerptLength);
  if (!pagefind) return null;

  const filters: Record<string, string[]> = { locale: [locale] };
  if (section !== undefined) filters['section'] = [section];

  const found = await pagefind.search(term, { filters });

  // Pagefind counts a filter only when its key was passed, and several values of one key are AND
  // rather than OR — so asking for all three sections at once returns nothing. With no section
  // chosen the counts come from a second search that names one, whose totalFilters reports every
  // section as if it had not been named.
  const counting =
    section !== undefined
      ? found
      : await pagefind.search(term, { filters: { locale: [locale], section: [sections[0]] } });

  const hits = await Promise.all(
    found.results.slice(offset, offset + limit).map(async (result) => {
      const data = await result.data();
      return {
        id: result.id,
        url: data.url,
        title: data.meta?.title ?? data.url,
        excerpt: data.excerpt,
      };
    }),
  );

  const counts = counting.totalFilters?.['section'] ?? {};

  return { hits, total: found.results.length, counts };
}
