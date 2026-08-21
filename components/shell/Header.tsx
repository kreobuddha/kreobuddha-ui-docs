import { Link } from 'react-router-dom';

import { AutoHideHeader } from './AutoHideHeader';
import { LocaleSwitcher } from './LocaleSwitcher';
import { CommandPalette } from '@/components/search/CommandPalette';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NavDrawer } from './NavDrawer';
import type { NavGroupData } from './NavTree';
import { useTranslation } from 'react-i18next';

import type { Locale } from '@/lib/i18n';
import { route } from '@/lib/links';

export function Header({
  locale,
  groups,
}: {
  locale: Locale;
  groups: NavGroupData[];
}) {
  const { t } = useTranslation();

  return (
    <AutoHideHeader>
      <NavDrawer
        groups={groups}
        label={t('documentationNav')}
        openLabel={t('openNavigation')}
        closeLabel={t('closeNavigation')}
        language={<LocaleSwitcher label={t('language')} />}
        theme={
          <ThemeToggle
            name="theme-mode-drawer"
            label={t('theme')}
            labels={{ light: t('themeLight'), dark: t('themeDark'), system: t('themeSystem') }}
          />
        }
      />

      <Link className="site-header__brand" to={route(locale)}>
        {t('siteTitle')}
      </Link>

      <nav className="site-header__nav" aria-label={t('documentationNav')}>
        <Link to={route(locale, '/docs')}>{t('docsTitle')}</Link>
        <Link to={route(locale, '/components')}>{t('componentsTitle')}</Link>
      </nav>

      <CommandPalette
        locale={locale}
        labels={{
          open: t('searchOpen'),
          title: t('searchTitle'),
          placeholder: t('searchPlaceholder'),
          empty: t('searchEmpty'),
          searching: t('searching'),
          shortcutHint: t('searchShortcut'),
          close: t('searchClose'),
          results: t('searchResults'),
        }}
      />

      <ThemeToggle
        name="theme-mode-header"
        className="theme-toggle--header"
        label={t('theme')}
        labels={{ light: t('themeLight'), dark: t('themeDark'), system: t('themeSystem') }}
      />

      <LocaleSwitcher label={t('language')} className="locale-switcher--header" />
    </AutoHideHeader>
  );
}
