import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import matter from 'gray-matter';

import { defaultLocale, locales, type Locale } from './i18n';

const CONTENT_ROOT = join(process.cwd(), 'content');

/*
 * Two collections, because they are read differently: a guide is prose in a reading order, a
 * component page is a reference someone arrives at from a search or a link. They share the file
 * format, the frontmatter and the fallback rules, and nothing else.
 */
export const collections = ['guides', 'components'] as const;

export type Collection = (typeof collections)[number];

const ROUTE_PREFIX: Record<Collection, string> = {
  guides: '/docs',
  components: '/components',
};

/** Where a page lives, inside a locale. Prefixing with `basePath` is `<Link>`'s job. */
export function docHref(collection: Collection, locale: Locale, slug: string): string {
  return `/${locale}${ROUTE_PREFIX[collection]}/${slug}`;
}

/** A page's place in the sidebar. Groups are ordered by `groupOrder` in `lib/nav.ts`. */
export interface DocMeta {
  collection: Collection;
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  /** The locale the file was actually read from — not necessarily the one that was asked for. */
  locale: Locale;
  /** True when the requested locale had no file and English was served instead. */
  isFallback: boolean;
}

export interface Doc extends DocMeta {
  source: string;
}

function collectionDir(collection: Collection, locale: Locale): string {
  return join(CONTENT_ROOT, locale, collection);
}

/*
 * Frontmatter is validated on read rather than trusted, and the failure is a thrown error rather
 * than a default. A guide with no title is a mistake in the file, and a build that quietly renders
 * "Untitled" hides it until someone browses the page; a build that stops names the file.
 */
function parseFrontmatter(
  raw: unknown,
  file: string,
  collection: Collection,
  slug: string,
  locale: Locale,
): DocMeta {
  const data = raw as Record<string, unknown>;
  const problems: string[] = [];

  const title = data.title;
  if (typeof title !== 'string' || title.trim() === '') problems.push('title must be a non-empty string');

  const description = data.description;
  if (typeof description !== 'string' || description.trim() === '') {
    problems.push('description must be a non-empty string');
  }

  /*
   * A guide declares which section it belongs to; a component page does not, because there is only
   * one place a component can go. Requiring it anyway would be a field with one legal value.
   */
  const group = collection === 'components' ? 'components' : data.group;
  if (typeof group !== 'string' || group.trim() === '') {
    problems.push('group must be a non-empty string');
  }

  const order = data.order;
  if (typeof order !== 'number' || !Number.isFinite(order)) problems.push('order must be a number');

  if (problems.length > 0) {
    throw new Error(`Invalid frontmatter in ${file}:\n  - ${problems.join('\n  - ')}`);
  }

  return {
    collection,
    slug,
    title: title as string,
    description: description as string,
    group: group as string,
    order: order as number,
    locale,
    isFallback: false,
  };
}

async function readDocFile(
  collection: Collection,
  locale: Locale,
  slug: string,
): Promise<Doc | null> {
  const file = join(collectionDir(collection, locale), `${slug}.mdx`);
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    return null;
  }

  const { content, data } = matter(raw);
  return { ...parseFrontmatter(data, file, collection, slug, locale), source: content };
}

async function slugsIn(collection: Collection, locale: Locale): Promise<string[]> {
  try {
    const entries = await readdir(collectionDir(collection, locale));
    return entries.filter((name) => name.endsWith('.mdx')).map((name) => name.replace(/\.mdx$/, ''));
  } catch {
    return [];
  }
}

/*
 * The set of guides a locale routes to — its own files plus everything English has that it does
 * not. Every locale therefore has the same URLs, which is what lets the language switcher stay on
 * the current page instead of dropping the reader at an index. Until a translation exists the page
 * serves English and says so; see `isFallback`.
 */
export async function docSlugs(collection: Collection, locale: Locale): Promise<string[]> {
  const own = await slugsIn(collection, locale);
  const fallback = locale === defaultLocale ? [] : await slugsIn(collection, defaultLocale);
  return [...new Set([...own, ...fallback])].sort();
}

export async function getDoc(
  collection: Collection,
  locale: Locale,
  slug: string,
): Promise<Doc | null> {
  const own = await readDocFile(collection, locale, slug);
  if (own) return own;

  if (locale === defaultLocale) return null;

  const fallback = await readDocFile(collection, defaultLocale, slug);
  return fallback ? { ...fallback, isFallback: true } : null;
}

/** Every guide a locale can serve, metadata only. Used to build the sidebar and prev/next. */
export async function getDocs(collection: Collection, locale: Locale): Promise<DocMeta[]> {
  const slugs = await docSlugs(collection, locale);
  const docs = await Promise.all(slugs.map((slug) => getDoc(collection, locale, slug)));

  return docs
    .filter((doc): doc is Doc => doc !== null)
    .map(({ source: _source, ...meta }) => meta);
}

/** Every (locale, slug) pair the export has to generate for the guides. */
export async function allGuideParams(): Promise<{ locale: Locale; slug: string[] }[]> {
  const params: { locale: Locale; slug: string[] }[] = [];
  for (const locale of locales) {
    params.push({ locale, slug: [] });
    for (const slug of await docSlugs('guides', locale)) params.push({ locale, slug: [slug] });
  }
  return params;
}

/** Every (locale, component) pair. The component index is a page of its own, not a catch-all. */
export async function allComponentParams(): Promise<{ locale: Locale; component: string }[]> {
  const params: { locale: Locale; component: string }[] = [];
  for (const locale of locales) {
    for (const component of await docSlugs('components', locale)) params.push({ locale, component });
  }
  return params;
}
