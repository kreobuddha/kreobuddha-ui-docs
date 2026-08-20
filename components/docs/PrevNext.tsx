import Link from 'next/link';

import type { GuideMeta } from '@/lib/content';
import { dictionary, type Locale } from '@/lib/i18n';
import { route } from '@/lib/links';

export function PrevNext({
  locale,
  previous,
  next,
}: {
  locale: Locale;
  previous: GuideMeta | null;
  next: GuideMeta | null;
}) {
  const t = dictionary[locale];
  if (previous === null && next === null) return null;

  return (
    <nav className="prev-next" aria-label={`${t.previous} / ${t.next}`}>
      {previous ? (
        <Link className="prev-next__link" href={route(locale, `/docs/${previous.slug}`)} rel="prev">
          <span className="prev-next__label">{t.previous}</span>
          <span className="prev-next__title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          className="prev-next__link prev-next__link--next"
          href={route(locale, `/docs/${next.slug}`)}
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
