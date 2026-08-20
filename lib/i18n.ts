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

/*
 * Shown instead of the full name where there is no room for it. Only ever the visible half: the
 * accessible name stays the language's own name, because "EN" is not what anyone calls it.
 */
export const localeShortNames: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
};

/*
 * UI strings, one record per locale, with the same keys in both. No fallback chain: a missing key
 * is a type error rather than an English word appearing mid-sentence in Russian.
 *
 * Content is a different matter — see `lib/content.ts`. A guide with no translation yet is served
 * in English behind a notice, because half a translated site is worth more than a locale with
 * holes in it.
 */
export interface Dictionary {
  siteTitle: string;
  siteTagline: string;
  docsTitle: string;
  home: string;
  skipToContent: string;
  documentationNav: string;
  onThisPage: string;
  previous: string;
  next: string;
  readTheDocs: string;
  language: string;
  openNavigation: string;
  closeNavigation: string;
  fallbackTitle: string;
  fallbackBody: string;
  guidesIndexLead: string;
  groups: Record<'getting-started' | 'foundations' | 'patterns', string>;
}

export const dictionary: Record<Locale, Dictionary> = {
  en: {
    siteTitle: '@kreobuddha/ui',
    siteTagline:
      'An accessible, themeable React component library for developer tools and data-dense interfaces.',
    docsTitle: 'Documentation',
    home: 'Home',
    skipToContent: 'Skip to content',
    documentationNav: 'Documentation',
    onThisPage: 'On this page',
    previous: 'Previous',
    next: 'Next',
    readTheDocs: 'Read the documentation',
    language: 'Language',
    openNavigation: 'Menu',
    closeNavigation: 'Close',
    fallbackTitle: 'Not translated yet',
    fallbackBody: 'This page has no Russian translation yet and is shown in English.',
    guidesIndexLead: 'Guides to the library: what it is, how to install it, and what it is built on.',
    groups: {
      'getting-started': 'Getting started',
      foundations: 'Foundations',
      patterns: 'Patterns',
    },
  },
  ru: {
    siteTitle: '@kreobuddha/ui',
    siteTagline:
      'Доступная и темизируемая библиотека React-компонентов для инструментов разработчика и плотных интерфейсов.',
    docsTitle: 'Документация',
    home: 'Главная',
    skipToContent: 'К содержимому',
    documentationNav: 'Документация',
    onThisPage: 'Содержание',
    previous: 'Назад',
    next: 'Вперёд',
    readTheDocs: 'Открыть документацию',
    language: 'Язык',
    openNavigation: 'Меню',
    closeNavigation: 'Закрыть',
    fallbackTitle: 'Перевода пока нет',
    fallbackBody: 'Эта страница ещё не переведена на русский и показана на английском.',
    guidesIndexLead:
      'Руководства по библиотеке: что это такое, как её поставить и на чём она построена.',
    groups: {
      'getting-started': 'Начало работы',
      foundations: 'Основы',
      patterns: 'Паттерны',
    },
  },
};
