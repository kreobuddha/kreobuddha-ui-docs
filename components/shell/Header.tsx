import Link from 'next/link';

import { LocaleSwitcher } from './LocaleSwitcher';
import { dictionary, type Locale } from '@/lib/i18n';
import { route } from '@/lib/links';

export function Header({ locale }: { locale: Locale }) {
  const t = dictionary[locale];

  return (
    <header className="site-header">
      <Link className="site-header__brand" href={route(locale)}>
        {t.siteTitle}
      </Link>

      <nav className="site-header__nav" aria-label={t.documentationNav}>
        <Link href={route(locale, '/docs')}>{t.docsTitle}</Link>
      </nav>

      <LocaleSwitcher label={t.language} />
    </header>
  );
}
