import Link from 'next/link';

import { dictionary, type Locale } from '@/lib/i18n';
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
  const t = dictionary[locale];
  if (previous === null && next === null) return null;

  return (
    <nav className="prev-next" data-pagefind-ignore aria-label={`${t.previous} / ${t.next}`}>
      {previous ? (
        <Link className="prev-next__link" href={previous.href} rel="prev">
          <span className="prev-next__label">{t.previous}</span>
          <span className="prev-next__title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          className="prev-next__link prev-next__link--next"
          href={next.href}
          rel="next"
        >
          <span className="prev-next__label">{t.next}</span>
          <span className="prev-next__title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
