import { Sidebar, type SidebarGroup } from '@/components/shell/Sidebar';
import { dictionary, isLocale } from '@/lib/i18n';
import { getNavTree } from '@/lib/nav';
import { notFound } from 'next/navigation';

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];
  const tree = await getNavTree(locale);

  // The tree is read on the server and handed over as plain data. The sidebar is a client
  // component only because it remembers collapsed sections and its own scroll position.
  const groups: SidebarGroup[] = tree.map((group) => ({
    id: group.id,
    label: t.groups[group.id],
    items: group.items.map(({ slug, title }) => ({ slug, title })),
  }));

  return (
    <div className="docs-layout">
      <Sidebar locale={locale} groups={groups} label={t.documentationNav} />
      <div className="docs-layout__body">{children}</div>
    </div>
  );
}
