import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { TokenTable } from '@/components/docs/TokenTable';
import { dictionary, isLocale, locales, type Locale } from '@/lib/i18n';

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
  return { title: t.tokensTitle, description: t.tokensLead };
}

/*
 * Every `--kreo-*` custom property the package publishes, in one place, read from the stylesheet at
 * build time. The guides explain the groups; this page is the list, for when someone knows what
 * they are looking for and needs the exact name.
 */
export default async function TokensPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];

  const sections = [
    { id: 'colour', heading: t.tokensColour, include: ['--kreo-neutral-', '--kreo-accent-', '--kreo-danger-', '--kreo-success-', '--kreo-warning-', '--kreo-info-'], preview: 'swatch' as const },
    { id: 'surface', heading: t.tokensSurface, include: ['--kreo-surface-'], preview: 'swatch' as const },
    { id: 'text', heading: t.tokensText, include: ['--kreo-text-'], exclude: ['--kreo-text-12', '--kreo-text-16', '--kreo-text-24', '--kreo-text-36'], preview: 'swatch' as const },
    { id: 'border', heading: t.tokensBorder, include: ['--kreo-border-', '--kreo-icon-'], preview: 'swatch' as const },
    { id: 'type', heading: t.tokensType, include: ['--kreo-type-', '--kreo-text-1', '--kreo-text-2', '--kreo-text-3', '--kreo-font-', '--kreo-weight-', '--kreo-leading-', '--kreo-tracking-', '--kreo-numeric-'], preview: 'none' as const },
    { id: 'space', heading: t.tokensSpace, include: ['--kreo-space-', '--kreo-control-'], preview: 'bar' as const },
    { id: 'shape', heading: t.tokensShape, include: ['--kreo-radius-'], preview: 'radius' as const },
    { id: 'motion', heading: t.tokensMotion, include: ['--kreo-duration-', '--kreo-ease', '--kreo-transition-'], preview: 'none' as const },
  ];

  return (
    <article className="prose">
      <Breadcrumbs locale={locale} trail={[{ label: t.tokensTitle }]} />
      <h1>{t.tokensTitle}</h1>
      <p className="lead">{t.tokensLead}</p>

      {sections.map((section) => (
        <section key={section.id}>
          <h2 id={section.id}>{section.heading}</h2>
          <TokenTable include={section.include} exclude={section.exclude} preview={section.preview} />
        </section>
      ))}
    </article>
  );
}
