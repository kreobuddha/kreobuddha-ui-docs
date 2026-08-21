import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '@/components/shell/Sidebar';
import type { NavGroupData } from '@/components/shell/NavTree';
import { getNavTree } from '@/lib/nav';
import type { Locale } from '@/lib/i18n';

export function DocsLayout({ locale }: { locale: Locale }) {
  const { t } = useTranslation();

  const groups: NavGroupData[] = getNavTree(locale, t('tokensTitle')).map((group) => ({
    id: group.id,
    label: t(`groups.${group.id}`),
    items: group.items,
  }));

  return (
    <div className="docs-layout">
      <Sidebar groups={groups} label={t('documentationNav')} />
      <div className="docs-layout__body">
        <Outlet />
      </div>
    </div>
  );
}
