import Link from 'next/link';
import { notFound } from 'next/navigation';

import { HeroPanel } from '@/components/landing/HeroPanel';
import { dictionary, isLocale } from '@/lib/i18n';
import { route } from '@/lib/links';

const REPOSITORY = 'https://github.com/kreobuddha/kreobuddha-ui';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = dictionary[locale];

  const promises = [
    { title: t.landingAccessibilityTitle, body: t.landingAccessibilityBody, href: route(locale, '/docs/accessibility') },
    { title: t.landingTokensTitle, body: t.landingTokensBody, href: route(locale, '/tokens') },
    { title: t.landingCompositionTitle, body: t.landingCompositionBody, href: route(locale, '/docs/composition') },
  ];

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero__text">
          <h1>{t.heroLead}</h1>
          <p className="lead">{t.heroBody}</p>

          <pre className="hero__install">
            <code>{t.heroInstall}</code>
          </pre>

          <p className="hero__links">
            <Link href={route(locale, '/docs')}>{t.heroDocs}</Link>
            <a href={REPOSITORY}>{t.heroGithub}</a>
          </p>
        </div>

        <div className="hero__panel">
          <HeroPanel
            labels={{
              panel: t.heroPanelLabel,
              tabs: t.heroPanelTabs,
              presets: t.heroPresetsLabel,
              presetDefault: t.heroPresetDefault,
            }}
          />
        </div>
      </section>

      <section className="promises">
        {promises.map((promise) => (
          <article key={promise.title}>
            <h2>
              <Link href={promise.href}>{promise.title}</Link>
            </h2>
            <p>{promise.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
