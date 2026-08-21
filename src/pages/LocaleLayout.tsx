import { I18nextProvider } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { Head } from 'vite-react-ssg';

import { instanceFor } from '@/src/i18n';
import { Header } from '@/components/shell/Header';
import type { NavGroupData } from '@/components/shell/NavTree';
import { getNavTree } from '@/lib/nav';
import { basePath, siteUrl } from '@/lib/links';
import type { Locale } from '@/lib/i18n';

export function LocaleLayout({ locale }: { locale: Locale }) {
  const i18n = instanceFor(locale);
  const t = i18n.t.bind(i18n);

  const groups: NavGroupData[] = getNavTree(locale, t('tokensTitle')).map((group) => ({
    id: group.id,
    label: t(`groups.${group.id}`),
    items: group.items,
  }));

  return (
    <I18nextProvider i18n={i18n}>
      <Head>
        <html lang={locale} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={t('siteTitle')} />
        <meta property="og:locale" content={locale} />
        <meta name="twitter:card" content="summary" />
        <link rel="alternate" hrefLang="en" href={`${siteUrl}${basePath}/en/`} />
        <link rel="alternate" hrefLang="ru" href={`${siteUrl}${basePath}/ru/`} />
      </Head>

      <a className="skip-link" href="#content">
        {t('skipToContent')}
      </a>

      <Header locale={locale} groups={groups} />

      <main id="content" tabIndex={-1}>
        <Outlet />
      </main>
    </I18nextProvider>
  );
}
