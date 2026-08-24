import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { Locale } from '@utils/i18n';
import { route } from '@utils/links';

interface Crumb {
  label: string;
  href?: string;
}

const Breadcrumbs = ({ locale, trail }: { locale: Locale; trail: Crumb[] }) => {
  const { t } = useTranslation();

  return (
    <nav className="breadcrumbs" data-pagefind-ignore aria-label={t('breadcrumbNav')}>
      <ol>
        <li>
          <Link to={route(locale)}>{t('home')}</Link>
        </li>
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`}>
            {crumb.href === undefined ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
