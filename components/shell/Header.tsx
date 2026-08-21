import Link from 'next/link';

import { AutoHideHeader } from './AutoHideHeader';
import { LocaleSwitcher } from './LocaleSwitcher';
import { NavDrawer } from './NavDrawer';
import type { NavGroupData } from './NavTree';
import { dictionary, type Locale } from '@/lib/i18n';
import { route } from '@/lib/links';

export function Header({ locale, groups }: { locale: Locale; groups: NavGroupData[] }) {
  const t = dictionary[locale];

  return (
    <AutoHideHeader>
      {/*
        The drawer trigger comes first in the source, and the CSS shows it only where the rail is
        gone. Reading order and tab order then match what is on screen on a phone: navigation,
        then brand, then language.
      */}
      <NavDrawer
        groups={groups}
        label={t.documentationNav}
        openLabel={t.openNavigation}
        closeLabel={t.closeNavigation}
      />

      <Link className="site-header__brand" href={route(locale)}>
        {t.siteTitle}
      </Link>

      <nav className="site-header__nav" aria-label={t.documentationNav}>
        <Link href={route(locale, '/docs')}>{t.docsTitle}</Link>
        <Link href={route(locale, '/components')}>{t.componentsTitle}</Link>
      </nav>

      <LocaleSwitcher label={t.language} />
    </AutoHideHeader>
  );
}
