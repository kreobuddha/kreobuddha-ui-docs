import { getGuides, type GuideMeta } from './content';
import type { Locale } from './i18n';

/*
 * Group order is declared, not derived. Sorting groups alphabetically would put "Foundations"
 * before "Getting started", which is the wrong order to read them in, and deriving it from the
 * first guide's `order` would make one file's number silently control a whole section.
 */
export const groupOrder = ['getting-started', 'foundations', 'patterns'] as const;

export type GroupId = (typeof groupOrder)[number];

export function isGroupId(value: string): value is GroupId {
  return (groupOrder as readonly string[]).includes(value);
}

export interface NavGroup {
  id: GroupId;
  items: GuideMeta[];
}

/** The sidebar tree: declared group order, and `order` from frontmatter inside each group. */
export async function getNavTree(locale: Locale): Promise<NavGroup[]> {
  const guides = await getGuides(locale);

  for (const guide of guides) {
    if (!isGroupId(guide.group)) {
      throw new Error(
        `Guide '${guide.slug}' declares group '${guide.group}', which is not in groupOrder ` +
          `(${groupOrder.join(', ')}). Add the group there or fix the frontmatter.`,
      );
    }
  }

  return groupOrder
    .map((id) => ({
      id,
      items: guides
        .filter((guide) => guide.group === id)
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    }))
    .filter((group) => group.items.length > 0);
}

/*
 * Reading order, flattened from the same tree the sidebar draws. Prev/next and the sidebar cannot
 * disagree, because there is only one ordering and both read it.
 */
export async function getReadingOrder(locale: Locale): Promise<GuideMeta[]> {
  const tree = await getNavTree(locale);
  return tree.flatMap((group) => group.items);
}

export interface Neighbours {
  previous: GuideMeta | null;
  next: GuideMeta | null;
}

export async function getNeighbours(locale: Locale, slug: string): Promise<Neighbours> {
  const order = await getReadingOrder(locale);
  const index = order.findIndex((guide) => guide.slug === slug);
  if (index === -1) return { previous: null, next: null };

  return {
    previous: order[index - 1] ?? null,
    next: order[index + 1] ?? null,
  };
}
