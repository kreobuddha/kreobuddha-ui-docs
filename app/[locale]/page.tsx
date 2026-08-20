import Link from 'next/link';
import { notFound } from 'next/navigation';

import { dictionary, isLocale } from '@/lib/i18n';
import { route } from '@/lib/links';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];

  return (
    <div className="landing">
      <h1>{t.siteTitle}</h1>
      <p className="lead">{t.siteTagline}</p>
      <p>
        <Link href={route(locale, '/docs')}>{t.readTheDocs}</Link>
      </p>
    </div>
  );
}
