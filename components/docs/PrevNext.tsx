import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import type { Locale } from '@/lib/i18n';
import type { NavItem } from '@/lib/nav';

export function PrevNext({
  locale,
  previous,
  next,
}: {
  locale: Locale;
  previous: NavItem | null;
  next: NavItem | null;
}) {
  const { t } = useTranslation();
  if (previous === null && next === null) return null;

  return (
    <nav className="prev-next" data-pagefind-ignore aria-label={`${t('previous')} / ${t('next')}`}>
      {previous ? (
        <Link className="prev-next__link" to={previous.href} rel="prev">
          <span className="prev-next__label">{t('previous')}</span>
          <span className="prev-next__title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          className="prev-next__link prev-next__link--next"
          to={next.href}
          rel="next"
        >
          <span className="prev-next__label">{t('next')}</span>
          <span className="prev-next__title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
