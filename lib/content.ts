import type { ComponentType } from 'react';

import { entries } from 'virtual:content';

import { defaultLocale, isLocale, type Locale } from './i18n';

export const collections = ['guides', 'components'] as const;

export type Collection = (typeof collections)[number];

const ROUTE_PREFIX: Record<Collection, string> = {
  guides: '/docs',
  components: '/components',
};

export function docHref(collection: Collection, locale: Locale, slug: string): string {
  return `/${locale}${ROUTE_PREFIX[collection]}/${slug}/`;
}

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface DocMeta {
  collection: Collection;
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  locale: Locale;
  isFallback: boolean;
}

export interface DocModule {
  default: ComponentType<{ components?: Record<string, ComponentType<never>> }>;
  headings: Heading[];
}

const catalogue = new Map<string, DocMeta>();

for (const entry of entries) {
  if (!isLocale(entry.locale)) continue;
  if (!(collections as readonly string[]).includes(entry.collection)) continue;

  const collection = entry.collection as Collection;
  catalogue.set(`/content/${entry.locale}/${entry.collection}/${entry.slug}.mdx`, {
    collection,
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    group: entry.group,
    order: entry.order,
    locale: entry.locale,
    isFallback: false,
  });
}

const loaders = import.meta.glob<DocModule>('/content/*/*/*.mdx');

function pathOf(collection: Collection, locale: Locale, slug: string): string {
  return `/content/${locale}/${collection}/${slug}.mdx`;
}

export function getDocs(collection: Collection, locale: Locale): DocMeta[] {
  const own = new Map<string, DocMeta>();

  for (const [path, meta] of catalogue) {
    if (meta.collection !== collection) continue;
    if (meta.locale === locale) own.set(meta.slug, meta);
  }

  for (const [path, meta] of catalogue) {
    if (meta.collection !== collection || meta.locale !== defaultLocale) continue;
    if (!own.has(meta.slug)) own.set(meta.slug, { ...meta, isFallback: true });
  }

  return [...own.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getDoc(collection: Collection, locale: Locale, slug: string): DocMeta | null {
  const own = catalogue.get(pathOf(collection, locale, slug));
  if (own) return own;

  const fallback = catalogue.get(pathOf(collection, defaultLocale, slug));
  return fallback ? { ...fallback, isFallback: true } : null;
}

export function loadDoc(meta: DocMeta): Promise<DocModule> {
  const path = pathOf(meta.collection, meta.locale, meta.slug);
  const loader = loaders[path];
  if (!loader) throw new Error(`No MDX module for ${path}.`);

  return loader();
}
