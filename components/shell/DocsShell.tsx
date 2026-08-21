import type { NavGroupData } from './NavTree';
import { Sidebar } from './Sidebar';
import { dictionary, type Locale } from '@/lib/i18n';
import { getNavTree } from '@/lib/nav';

/*
 * The rail plus the page beside it, shared by the guides and the component reference. Two route
 * layouts need the same frame, and Next has no way to hand one layout's data to another, so the
 * frame is a component both of them render.
 */
export async function DocsShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = dictionary[locale];
  const tree = await getNavTree(locale);

  // The tree is read on the server and handed over as plain data. The sidebar is a client
  // component only because it remembers collapsed sections and its own scroll position.
  const groups: NavGroupData[] = tree.map((group) => ({
    id: group.id,
    label: t.groups[group.id],
    items: group.items,
  }));

  return (
    <div className="docs-layout">
      <Sidebar groups={groups} label={t.documentationNav} />
      <div className="docs-layout__body">{children}</div>
    </div>
  );
}
