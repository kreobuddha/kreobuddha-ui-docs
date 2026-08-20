import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui';
import { dictionary, isLocale, locales } from '@/lib/i18n';
import { route } from '@/lib/links';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];
  const other = locales.find((candidate) => candidate !== locale) ?? locale;

  return (
    <main style={{ maxWidth: '45rem', margin: '0 auto', padding: '2rem' }}>
      <h1>{t.title}</h1>
      <p>{t.tagline}</p>

      <p>
        <Link href={route(other)}>{t.otherLocaleName}</Link>
      </p>

      {/*
        The two assumptions this stage exists to settle, both visible on the page rather than
        asserted in a comment.
      */}

      {/* One: the site's layer beats the library's, even from a weaker selector. */}
      <section data-layer-proof>
        <h2>Cascade layers</h2>
        <Button variant="filled">Square corners come from the site layer</Button>
      </section>

      {/* Two: tokens are inherited, so a scope repaints what is inside it and nothing else. */}
      <section>
        <h2>Token scope</h2>
        <div className="preview-scope">
          <Button variant="filled">Accent overridden inside the preview scope</Button>
        </div>
        <Button variant="filled">Accent untouched outside it</Button>
      </section>
    </main>
  );
}
