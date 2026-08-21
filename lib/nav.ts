import { docHref, getDocs, type DocMeta } from './content';
import type { Locale } from './i18n';

export const groupOrder = [
  'getting-started',
  'foundations',
  'patterns',
  'components',
  'design',
] as const;

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

export function getNavTree(locale: Locale, tokensTitle: string): NavGroup[] {
  const guides = getDocs('guides', locale);
  const components = getDocs('components', locale);

  for (const guide of guides) {
    if (!isGroupId(guide.group) || guide.group === 'components' || guide.group === 'design') {
      throw new Error(
        `Guide '${guide.slug}' declares group '${guide.group}', which is not a guide group ` +
          `(${groupOrder.slice(0, -2).join(', ')}). Add the group to groupOrder or fix the ` +
          'frontmatter.',
      );
    }
  }

  return groupOrder
    .map((id) => ({
      id,
      items:
        id === 'design'
          ? [{ slug: 'tokens', title: tokensTitle, href: `/${locale}/tokens/` }]
          : (id === 'components' ? components : guides.filter((guide) => guide.group === id)).map(
              (doc) => toItem(locale, doc),
            ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getReadingOrder(locale: Locale, tokensTitle: string): NavItem[] {
  return getNavTree(locale, tokensTitle).flatMap((group) => group.items);
}

export interface Neighbours {
  previous: NavItem | null;
  next: NavItem | null;
}

export function getNeighbours(locale: Locale, tokensTitle: string, href: string): Neighbours {
  const order = getReadingOrder(locale, tokensTitle);
  const index = order.findIndex((item) => item.href === href);
  if (index === -1) return { previous: null, next: null };

  return { previous: order[index - 1] ?? null, next: order[index + 1] ?? null };
}
