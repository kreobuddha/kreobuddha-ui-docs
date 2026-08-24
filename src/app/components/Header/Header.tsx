import { Link } from 'react-router-dom';

import AutoHideHeader from '@components/AutoHideHeader/AutoHideHeader';
import LocaleSwitcher from '@components/LocaleSwitcher/LocaleSwitcher';
import CommandPalette from '@components/CommandPalette/CommandPalette';
import ThemeToggle from '@components/ThemeToggle/ThemeToggle';
import NavDrawer from '@components/NavDrawer/NavDrawer';
import type { NavGroupData } from '@components/NavTree/NavTree';
import { useTranslation } from 'react-i18next';

import type { Locale } from '@utils/i18n';
import { route } from '@utils/links';

const Header = ({
  locale,
  groups,
}: {
  locale: Locale;
  groups: NavGroupData[];
}) => {
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
};

export default Header;
