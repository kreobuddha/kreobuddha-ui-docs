import type { RouteRecord } from 'vite-react-ssg';

import { ComponentsIndex } from './pages/ComponentsIndex';
import { Doc } from './pages/Doc';
import { DocsLayout } from './pages/DocsLayout';
import { GuideIndex } from './pages/GuideIndex';
import { Landing } from './pages/Landing';
import { LocaleLayout } from './pages/LocaleLayout';
import { LocalePicker } from './pages/LocalePicker';
import { NotFound } from './pages/NotFound';
import { Tokens } from './pages/Tokens';
import { getDocs, loadDoc, type Collection } from '@/lib/content';
import { locales, type Locale } from '@/lib/i18n';

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
