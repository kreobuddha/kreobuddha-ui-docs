export const locales = ['en', 'ru'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};

export const localeShortNames: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
};

export const LOCALE_STORAGE_KEY = 'kb-docs-locale';
