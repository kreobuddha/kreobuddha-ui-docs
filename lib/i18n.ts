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
  themeEditorTitle: string;
  themeEditorLead: string;
  themePresets: string;
  themeReset: string;
  themeCopyCss: string;
  themeCopyLink: string;
  themeCopied: string;
  themeContrast: string;
  themePreview: string;
  themeExport: string;
  themePreviewHeading: string;
  themePreviewBody: string;
  tokensTitle: string;
  tokensLead: string;
  tokensColour: string;
  tokensSurface: string;
  tokensText: string;
  tokensBorder: string;
  tokensType: string;
  tokensSpace: string;
  tokensShape: string;
  tokensMotion: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  openNavigation: string;
  closeNavigation: string;
  fallbackTitle: string;
  fallbackBody: string;
  guidesIndexLead: string;
  componentsTitle: string;
  componentsIndexLead: string;
  props: string;
  propName: string;
  propType: string;
  propDefault: string;
  propDescription: string;
  required: string;
  playground: string;
  playgroundCode: string;
  groups: Record<
    'getting-started' | 'foundations' | 'patterns' | 'components' | 'design',
    string
  >;
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
    themeEditorTitle: 'Theme editor',
    themeEditorLead:
      'Change the tokens and watch the components follow. Everything here is scoped to the preview: an unreadable theme never costs you the page around it.',
    themePresets: 'Presets',
    themeReset: 'Reset',
    themeCopyCss: 'Copy CSS',
    themeCopyLink: 'Copy link',
    themeCopied: 'Copied',
    themeContrast: 'Contrast',
    themePreview: 'Preview',
    themeExport: 'CSS',
    themePreviewHeading: 'Deployment settings',
    themePreviewBody: 'Every control below is the library, reading the tokens set on this panel.',
    tokensTitle: 'Design tokens',
    tokensLead: 'Every custom property the package publishes, read from its stylesheet when this site is built.',
    tokensColour: 'Ramps',
    tokensSurface: 'Surfaces',
    tokensText: 'Text',
    tokensBorder: 'Borders and icons',
    tokensType: 'Typography',
    tokensSpace: 'Spacing',
    tokensShape: 'Shape',
    tokensMotion: 'Motion',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    openNavigation: 'Menu',
    closeNavigation: 'Close',
    fallbackTitle: 'Not translated yet',
    fallbackBody: 'This page has no Russian translation yet and is shown in English.',
    guidesIndexLead: 'Guides to the library: what it is, how to install it, and what it is built on.',
    componentsTitle: 'Components',
    componentsIndexLead:
      'The components this site documents, with their props, their keyboard behaviour and an example to drive.',
    props: 'Props',
    propName: 'Prop',
    propType: 'Type',
    propDefault: 'Default',
    propDescription: 'Description',
    required: 'Required',
    playground: 'Example',
    playgroundCode: 'Code',
    groups: {
      'getting-started': 'Getting started',
      foundations: 'Foundations',
      patterns: 'Patterns',
      components: 'Components',
      design: 'Design',
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
    themeEditorTitle: 'Редактор тем',
    themeEditorLead:
      'Меняйте токены и смотрите, как за ними идут компоненты. Всё здесь ограничено превью: нечитаемая тема никогда не отнимет у вас страницу вокруг неё.',
    themePresets: 'Пресеты',
    themeReset: 'Сбросить',
    themeCopyCss: 'Скопировать CSS',
    themeCopyLink: 'Скопировать ссылку',
    themeCopied: 'Скопировано',
    themeContrast: 'Контраст',
    themePreview: 'Превью',
    themeExport: 'CSS',
    themePreviewHeading: 'Настройки деплоя',
    themePreviewBody: 'Каждый контрол ниже — это библиотека, читающая токены, заданные на этой панели.',
    tokensTitle: 'Дизайн-токены',
    tokensLead: 'Все кастомные свойства, которые публикует пакет, прочитанные из его стилей при сборке сайта.',
    tokensColour: 'Шкалы',
    tokensSurface: 'Поверхности',
    tokensText: 'Текст',
    tokensBorder: 'Границы и иконки',
    tokensType: 'Типографика',
    tokensSpace: 'Отступы',
    tokensShape: 'Форма',
    tokensMotion: 'Движение',
    theme: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeSystem: 'Системная',
    openNavigation: 'Меню',
    closeNavigation: 'Закрыть',
    fallbackTitle: 'Перевода пока нет',
    fallbackBody: 'Эта страница ещё не переведена на русский и показана на английском.',
    guidesIndexLead:
      'Руководства по библиотеке: что это такое, как её поставить и на чём она построена.',
    componentsTitle: 'Компоненты',
    componentsIndexLead:
      'Компоненты, описанные на этом сайте: пропсы, поведение с клавиатуры и живой пример.',
    props: 'Пропсы',
    propName: 'Пропс',
    propType: 'Тип',
    propDefault: 'По умолчанию',
    propDescription: 'Описание',
    required: 'Обязательный',
    playground: 'Пример',
    playgroundCode: 'Код',
    groups: {
      'getting-started': 'Начало работы',
      foundations: 'Основы',
      patterns: 'Паттерны',
      components: 'Компоненты',
      design: 'Дизайн',
    },
  },
};
