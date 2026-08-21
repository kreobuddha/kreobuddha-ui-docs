import { docHref, getDocs, type DocMeta } from './content';
import type { Locale } from './i18n';

/*
 * Group order is declared, not derived. Sorting groups alphabetically would put "Foundations"
 * before "Getting started", which is the wrong order to read them in, and deriving it from the
 * first page's `order` would make one file's number silently control a whole section.
 *
 * `components` is last and is not a guide group: it is the reference, and it comes after the prose
 * that explains what to reference.
 */
export const groupOrder = ['getting-started', 'foundations', 'patterns', 'components'] as const;

export type GroupId = (typeof groupOrder)[number];

export function isGroupId(value: string): value is GroupId {
  return (groupOrder as readonly string[]).includes(value);
}

export interface NavItem {
  slug: string;
  title: string;
  href: string;
}

export interface NavGroup {
  id: GroupId;
  items: NavItem[];
}

function toItem(locale: Locale, doc: DocMeta): NavItem {
  return { slug: doc.slug, title: doc.title, href: docHref(doc.collection, locale, doc.slug) };
}

/** The sidebar tree: declared group order, and `order` from frontmatter inside each group. */
export async function getNavTree(locale: Locale): Promise<NavGroup[]> {
  const [guides, components] = await Promise.all([
    getDocs('guides', locale),
    getDocs('components', locale),
  ]);

  for (const guide of guides) {
    if (!isGroupId(guide.group) || guide.group === 'components') {
      throw new Error(
        `Guide '${guide.slug}' declares group '${guide.group}', which is not a guide group ` +
          `(${groupOrder.slice(0, -1).join(', ')}). Add the group to groupOrder or fix the ` +
          'frontmatter.',
      );
    }
  }

  const byOrder = (a: DocMeta, b: DocMeta) => a.order - b.order || a.title.localeCompare(b.title);

  return groupOrder
    .map((id) => ({
      id,
      items: (id === 'components'
        ? [...components].sort(byOrder)
        : guides.filter((guide) => guide.group === id).sort(byOrder)
      ).map((doc) => toItem(locale, doc)),
    }))
    .filter((group) => group.items.length > 0);
}

/*
 * Reading order, flattened from the same tree the sidebar draws. Prev/next and the sidebar cannot
 * disagree, because there is only one ordering and both read it.
 */
export async function getReadingOrder(locale: Locale): Promise<NavItem[]> {
  const tree = await getNavTree(locale);
  return tree.flatMap((group) => group.items);
}

export interface Neighbours {
  previous: NavItem | null;
  next: NavItem | null;
}

export async function getNeighbours(locale: Locale, href: string): Promise<Neighbours> {
  const order = await getReadingOrder(locale);
  const index = order.findIndex((item) => item.href === href);
  if (index === -1) return { previous: null, next: null };

  return { previous: order[index - 1] ?? null, next: order[index + 1] ?? null };
}
