import { I18nextProvider } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { Head } from 'vite-react-ssg';

import { instanceFor } from '@i18n';
import Header from '@components/Header/Header';
import type { NavGroupData } from '@components/NavTree/NavTree';
import { getNavTree } from '@utils/nav';
import { basePath, siteUrl } from '@utils/links';
import type { Locale } from '@utils/i18n';

const LocaleLayout = ({ locale }: { locale: Locale }) => {
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
        <meta property="og:image" content={`${siteUrl}${basePath}/og.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={t('siteTitle')} />
        <meta name="twitter:card" content="summary_large_image" />
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
};

export default LocaleLayout;
