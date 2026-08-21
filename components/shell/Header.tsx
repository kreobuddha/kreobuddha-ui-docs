import Link from 'next/link';

import { AutoHideHeader } from './AutoHideHeader';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NavDrawer } from './NavDrawer';
import type { NavGroupData } from './NavTree';
import { dictionary, type Locale } from '@/lib/i18n';
import { route } from '@/lib/links';

export function Header({
  locale,
  groups,
  colours,
}: {
  locale: Locale;
  groups: NavGroupData[];
  colours: { light: string; dark: string };
}) {
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
        theme={
          <ThemeToggle
            name="theme-mode-drawer"
            label={t.theme}
            labels={{ light: t.themeLight, dark: t.themeDark, system: t.themeSystem }}
            colours={colours}
          />
        }
      />

      <Link className="site-header__brand" href={route(locale)}>
        {t.siteTitle}
      </Link>

      <nav className="site-header__nav" aria-label={t.documentationNav}>
        <Link href={route(locale, '/docs')}>{t.docsTitle}</Link>
        <Link href={route(locale, '/components')}>{t.componentsTitle}</Link>
      </nav>

      <ThemeToggle
        name="theme-mode-header"
        className="theme-toggle--header"
        label={t.theme}
        labels={{ light: t.themeLight, dark: t.themeDark, system: t.themeSystem }}
        colours={colours}
      />

      <LocaleSwitcher label={t.language} />
    </AutoHideHeader>
  );
}
