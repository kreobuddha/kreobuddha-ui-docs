import { notFound } from 'next/navigation';

import { DocsShell } from '@/components/shell/DocsShell';
import { isLocale } from '@/lib/i18n';

export default async function TokensLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <DocsShell locale={locale}>{children}</DocsShell>;
}
