import type { NavGroupData } from './NavTree';
import { Sidebar } from './Sidebar';
import { dictionary, type Locale } from '@/lib/i18n';
import { getNavTree } from '@/lib/nav';

export async function DocsShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = dictionary[locale];
  const tree = await getNavTree(locale);

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
