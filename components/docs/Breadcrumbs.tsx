import Link from 'next/link';

import { dictionary, type Locale } from '@/lib/i18n';
import { route } from '@/lib/links';

export interface Crumb {
  label: string;
  href?: string;
}

/*
 * Built from the same tree as the sidebar and prev/next, so the three cannot disagree about where
 * a page sits. The last crumb is the current page: it is text, not a link to itself.
 */
export function Breadcrumbs({ locale, trail }: { locale: Locale; trail: Crumb[] }) {
  const t = dictionary[locale];

  return (
    <nav className="breadcrumbs" data-pagefind-ignore aria-label={t.documentationNav}>
      <ol>
        <li>
          <Link href={route(locale)}>{t.home}</Link>
        </li>
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`}>
            {crumb.href === undefined ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
