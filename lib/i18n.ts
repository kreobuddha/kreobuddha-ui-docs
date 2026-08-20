export const locales = ['en', 'ru'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

// Stage 2 carries only what the single scaffolded page needs. The real dictionaries arrive with
// the content layer; the shape — one record per locale, no fallback chain — is the part that is
// meant to survive.
export const dictionary = {
  en: {
    htmlLang: 'en',
    title: '@kreobuddha/ui — documentation',
    tagline: 'Documentation for a React component library for developer tools and data-dense interfaces.',
    status: 'Scaffold',
    localeName: 'English',
    otherLocaleName: 'Русский',
  },
  ru: {
    htmlLang: 'ru',
    title: '@kreobuddha/ui — документация',
    tagline: 'Документация React-библиотеки компонентов для инструментов разработчика и плотных интерфейсов.',
    status: 'Каркас',
    localeName: 'Русский',
    otherLocaleName: 'English',
  },
} as const satisfies Record<Locale, Record<string, string>>;
