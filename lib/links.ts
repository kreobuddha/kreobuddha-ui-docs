import { defaultLocale, type Locale } from './i18n';

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function asset(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalised}`;
}

export function route(locale: Locale = defaultLocale, path = ''): string {
  const normalised = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalised}/`;
}

export const siteUrl = import.meta.env.VITE_SITE_URL ?? 'https://kreobuddha.github.io';

export function localeAlternates(path = ''): Record<string, string> {
  const normalised = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return Object.fromEntries(
    ['en', 'ru'].map((locale) => [locale, `${siteUrl}${basePath}/${locale}${normalised}/`]),
  );
}
