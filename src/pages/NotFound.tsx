import { Head } from 'vite-react-ssg';

import { asset } from '@/lib/links';
import { localeNames, locales } from '@/lib/i18n';

export function NotFound() {
  return (
    <div className="not-found">
      <Head>
        <title>404 — @kreobuddha/ui</title>
        <meta name="robots" content="noindex" />
      </Head>

      <h1>404</h1>
      <p>This page does not exist. / Такой страницы нет.</p>

      <p>
        {locales.map((locale, index) => (
          <span key={locale}>
            {index > 0 ? ' · ' : null}
            <a href={asset(`/${locale}/`)}>{localeNames[locale]}</a>
          </span>
        ))}
      </p>
    </div>
  );
}
