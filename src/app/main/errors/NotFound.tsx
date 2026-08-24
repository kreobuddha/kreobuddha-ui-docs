import { Head } from 'vite-react-ssg';

import { asset } from '@utils/links';
import { localeNames, locales } from '@utils/i18n';

const NotFound = () => {
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
};

export default NotFound;
