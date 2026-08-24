import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@locales/en.json';
import ru from '@locales/ru.json';

import type { Locale } from '@utils/i18n';

const resources = { en, ru };

const instances = new Map<Locale, i18n>();

export function instanceFor(locale: Locale): i18n {
  const existing = instances.get(locale);
  if (existing) return existing;

  const instance = createInstance();
  instance.use(initReactI18next).init({
    lng: locale,
    resources: { [locale]: { translation: resources[locale] } },
    fallbackLng: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  instances.set(locale, instance);
  return instance;
}

export type Dictionary = typeof en;
