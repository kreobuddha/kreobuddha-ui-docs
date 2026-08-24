import { Head } from 'vite-react-ssg';

import { basePath, siteUrl } from '@/lib/links';
import { localeAlternates } from '@/lib/links';
import type { Locale } from '@/lib/i18n';

export function Meta({
  title,
  description,
  locale,
  path,
  siteTitle,
}: {
  title?: string;
  description: string;
  locale: Locale;
  path: string;
  siteTitle: string;
}) {
  const full = title === undefined ? siteTitle : `${title} — ${siteTitle}`;
  const alternates = localeAlternates(path);

  return (
    <Head>
      <title>{full}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={`${siteUrl}${basePath}/${locale}${path}/`} />
      <link rel="canonical" href={`${siteUrl}${basePath}/${locale}${path}/`} />
      <link rel="alternate" hrefLang="en" href={alternates['en']} />
      <link rel="alternate" hrefLang="ru" href={alternates['ru']} />
    </Head>
  );
}
