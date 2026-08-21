'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isLocale, locales, localeNames, localeShortNames, type Locale } from '@/lib/i18n';

/*
 * Switching language keeps the reader where they are. The path is rewritten segment by segment
 * rather than sending everyone to the index, which is the whole difference between a language
 * switch and a language reset.
 *
 * `usePathname` reports the path without `basePath`, and `<Link>` puts it back, so nothing here
 * has to know where the site is mounted.
 */
export function LocaleSwitcher({ label }: { label: string }) {
  const pathname = usePathname();

  const swap = (target: Locale): string => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && isLocale(segments[0]!)) {
      segments[0] = target;
      return `/${segments.join('/')}/`;
    }
    return `/${target}/`;
  };

  return (
    <nav className="locale-switcher" aria-label={label}>
      <ul>
        {locales.map((locale) => {
          const isCurrent = pathname.split('/').filter(Boolean)[0] === locale;
          return (
            <li key={locale}>
              <Link
                href={swap(locale)}
                hrefLang={locale}
                lang={locale}
                // The current language is still a link — it goes to this same page — but it is
                // announced as the current one rather than looking identical to the other.
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span className="locale-switcher__full">{localeNames[locale]}</span>
                <span className="locale-switcher__short" aria-hidden="true">
                  {localeShortNames[locale]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
