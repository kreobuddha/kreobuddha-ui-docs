import { docHref, getDocs, type DocMeta } from './content';
import { dictionary, type Locale } from './i18n';

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

function designItems(locale: Locale): NavItem[] {
  const t = dictionary[locale];
  return [
    { slug: 'tokens', title: t.tokensTitle, href: `/${locale}/tokens` },
    { slug: 'theme', title: t.themeEditorTitle, href: `/${locale}/theme` },
  ];
}

function toItem(locale: Locale, doc: DocMeta): NavItem {
  return { slug: doc.slug, title: doc.title, href: docHref(doc.collection, locale, doc.slug) };
}

export async function getNavTree(locale: Locale): Promise<NavGroup[]> {
  const [guides, components] = await Promise.all([
    getDocs('guides', locale),
    getDocs('components', locale),
  ]);

  for (const guide of guides) {
    if (!isGroupId(guide.group) || guide.group === 'components' || guide.group === 'design') {
      throw new Error(
        `Guide '${guide.slug}' declares group '${guide.group}', which is not a guide group ` +
          `(${groupOrder.slice(0, -2).join(', ')}). Add the group to groupOrder or fix the ` +
          'frontmatter.',
      );
    }
  }

  const byOrder = (a: DocMeta, b: DocMeta) => a.order - b.order || a.title.localeCompare(b.title);

  return groupOrder
    .map((id) => ({
      id,
      items:
        id === 'design'
          ? designItems(locale)
          : (id === 'components'
              ? [...components].sort(byOrder)
              : guides.filter((guide) => guide.group === id).sort(byOrder)
            ).map((doc) => toItem(locale, doc)),
    }))
    .filter((group) => group.items.length > 0);
}

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
