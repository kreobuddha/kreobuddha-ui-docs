import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import matter from 'gray-matter';

import { defaultLocale, locales, type Locale } from './i18n';

const CONTENT_ROOT = join(process.cwd(), 'content');

/** A guide's place in the sidebar. Groups are ordered by `groupOrder` in `lib/nav.ts`. */
export interface GuideMeta {
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

export interface Guide extends GuideMeta {
  source: string;
}

function guidesDir(locale: Locale): string {
  return join(CONTENT_ROOT, locale, 'guides');
}

/*
 * Frontmatter is validated on read rather than trusted, and the failure is a thrown error rather
 * than a default. A guide with no title is a mistake in the file, and a build that quietly renders
 * "Untitled" hides it until someone browses the page; a build that stops names the file.
 */
function parseFrontmatter(raw: unknown, file: string, slug: string, locale: Locale): GuideMeta {
  const data = raw as Record<string, unknown>;
  const problems: string[] = [];

  const title = data.title;
  if (typeof title !== 'string' || title.trim() === '') problems.push('title must be a non-empty string');

  const description = data.description;
  if (typeof description !== 'string' || description.trim() === '') {
    problems.push('description must be a non-empty string');
  }

  const group = data.group;
  if (typeof group !== 'string' || group.trim() === '') problems.push('group must be a non-empty string');

  const order = data.order;
  if (typeof order !== 'number' || !Number.isFinite(order)) problems.push('order must be a number');

  if (problems.length > 0) {
    throw new Error(`Invalid frontmatter in ${file}:\n  - ${problems.join('\n  - ')}`);
  }

  return {
    slug,
    title: title as string,
    description: description as string,
    group: group as string,
    order: order as number,
    locale,
    isFallback: false,
  };
}

async function readGuideFile(locale: Locale, slug: string): Promise<Guide | null> {
  const file = join(guidesDir(locale), `${slug}.mdx`);
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    return null;
  }

  const { content, data } = matter(raw);
  return { ...parseFrontmatter(data, file, slug, locale), source: content };
}

async function slugsIn(locale: Locale): Promise<string[]> {
  try {
    const entries = await readdir(guidesDir(locale));
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
export async function guideSlugs(locale: Locale): Promise<string[]> {
  const own = await slugsIn(locale);
  const fallback = locale === defaultLocale ? [] : await slugsIn(defaultLocale);
  return [...new Set([...own, ...fallback])].sort();
}

export async function getGuide(locale: Locale, slug: string): Promise<Guide | null> {
  const own = await readGuideFile(locale, slug);
  if (own) return own;

  if (locale === defaultLocale) return null;

  const fallback = await readGuideFile(defaultLocale, slug);
  return fallback ? { ...fallback, isFallback: true } : null;
}

/** Every guide a locale can serve, metadata only. Used to build the sidebar and prev/next. */
export async function getGuides(locale: Locale): Promise<GuideMeta[]> {
  const slugs = await guideSlugs(locale);
  const guides = await Promise.all(slugs.map((slug) => getGuide(locale, slug)));

  return guides
    .filter((guide): guide is Guide => guide !== null)
    .map(({ source: _source, ...meta }) => meta);
}

/** Every (locale, slug) pair the export has to generate. */
export async function allGuideParams(): Promise<{ locale: Locale; slug: string[] }[]> {
  const params: { locale: Locale; slug: string[] }[] = [];
  for (const locale of locales) {
    params.push({ locale, slug: [] });
    for (const slug of await guideSlugs(locale)) params.push({ locale, slug: [slug] });
  }
  return params;
}
