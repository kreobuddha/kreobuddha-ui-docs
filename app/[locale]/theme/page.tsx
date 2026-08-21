import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { ThemeEditor } from '@/components/theme/ThemeEditor';
import { dictionary, isLocale, locales, type Locale } from '@/lib/i18n';
import { editableTokens, resolveTokenValue } from '@/lib/theme';
import { tokenMaps } from '@/lib/tokens';

export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = dictionary[locale];
  return { title: t.themeEditorTitle, description: t.themeEditorLead };
}

export default async function ThemePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];

  /*
   * The starting values come from the library's own light theme, read at build time and resolved
   * through their `var()` references. Writing a copy of them here would be a second source of
   * truth that goes stale the first time the library changes a colour.
   */
  const { light } = await tokenMaps();
  const defaults = Object.fromEntries(
    editableTokens.map((token) => [token.name, resolveTokenValue(light, token.name) ?? '#000000']),
  );

  return (
    <article className="prose">
      <Breadcrumbs locale={locale} trail={[{ label: t.themeEditorTitle }]} />
      <h1>{t.themeEditorTitle}</h1>
      <p className="lead">{t.themeEditorLead}</p>

      <ThemeEditor
        defaults={defaults}
        labels={{
          presets: t.themePresets,
          reset: t.themeReset,
          copyCss: t.themeCopyCss,
          copyLink: t.themeCopyLink,
          copied: t.themeCopied,
          contrast: t.themeContrast,
          preview: t.themePreview,
          exportTitle: t.themeExport,
          previewHeading: t.themePreviewHeading,
          previewBody: t.themePreviewBody,
        }}
      />
    </article>
  );
}
