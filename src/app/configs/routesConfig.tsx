import type { RouteRecord } from 'vite-react-ssg';

import ComponentsIndex from '@sections/Components/ComponentsIndex';
import Doc from '@sections/Docs/Doc';
import DocsLayout from '@components/DocsLayout/DocsLayout';
import GuideIndex from '@sections/Docs/GuideIndex';
import Landing from '@sections/Landing/Landing';
import LocaleLayout from '@components/LocaleLayout/LocaleLayout';
import LocalePicker from '@sections/LocalePicker/LocalePicker';
import NotFound from '../main/errors/NotFound';
import Tokens from '@sections/Tokens/Tokens';
import { getDocs, loadDoc, type Collection } from '@utils/content';
import { locales, type Locale } from '@utils/i18n';

function docRoutes(collection: Collection, locale: Locale): RouteRecord[] {
  return getDocs(collection, locale).map((meta) => ({
    path: meta.slug,
    lazy: async () => {
      const module = await loadDoc(meta);
      return { Component: () => <Doc locale={locale} meta={meta} module={module} /> };
    },
  }));
}

export const routes: RouteRecord[] = [
  { path: '/', element: <LocalePicker /> },
  { path: '/404', element: <NotFound /> },

  ...locales.map((locale) => ({
    path: `/${locale}`,
    element: <LocaleLayout locale={locale} />,
    children: [
      { index: true, element: <Landing locale={locale} /> },
      {
        path: 'docs',
        element: <DocsLayout locale={locale} />,
        children: [
          { index: true, element: <GuideIndex locale={locale} /> },
          ...docRoutes('guides', locale),
        ],
      },
      {
        path: 'components',
        element: <DocsLayout locale={locale} />,
        children: [
          { index: true, element: <ComponentsIndex locale={locale} /> },
          ...docRoutes('components', locale),
        ],
      },
      {
        path: 'tokens',
        element: <DocsLayout locale={locale} />,
        children: [{ index: true, element: <Tokens locale={locale} /> }],
      },
    ],
  })),
];
