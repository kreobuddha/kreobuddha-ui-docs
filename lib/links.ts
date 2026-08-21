import { defaultLocale, type Locale } from './i18n';

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalised}`;
}

export function route(locale: Locale = defaultLocale, path = ''): string {
  const normalised = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalised}`;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kreobuddha.github.io';

export function localeAlternates(path = ''): Record<string, string> {
  const normalised = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return Object.fromEntries(
    ['en', 'ru'].map((locale) => [locale, `${basePath}/${locale}${normalised}/`]),
  );
}
