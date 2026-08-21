import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { isLocale, locales, localeNames, localeShortNames, type Locale } from '@/lib/i18n';

export function LocaleSwitcher({ label, className }: { label: string; className?: string }) {
  const pathname = useLocation().pathname;

  const swap = (target: Locale): string => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && isLocale(segments[0]!)) {
      segments[0] = target;
      return `/${segments.join('/')}/`;
    }
    return `/${target}/`;
  };

  return (
    <nav
      className={className === undefined ? 'locale-switcher' : `locale-switcher ${className}`}
      aria-label={label}
    >
      <ul>
        {locales.map((locale) => {
          const isCurrent = pathname.split('/').filter(Boolean)[0] === locale;
          return (
            <li key={locale}>
              <Link
                to={swap(locale)}
                hrefLang={locale}
                lang={locale}
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
