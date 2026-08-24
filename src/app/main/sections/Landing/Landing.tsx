import './Landing.css';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import Meta from '@components/Meta/Meta';
import HeroPanel from '@components/HeroPanel/HeroPanel';
import { route } from '@utils/links';
import type { Locale } from '@utils/i18n';

const REPOSITORY = 'https://github.com/kreobuddha/kreobuddha-ui';

const Landing = ({ locale }: { locale: Locale }) => {
  const { t } = useTranslation();

  const promises = [
    { title: t('landingAccessibilityTitle'), body: t('landingAccessibilityBody'), href: route(locale, '/docs/accessibility') },
    { title: t('landingTokensTitle'), body: t('landingTokensBody'), href: route(locale, '/tokens') },
    { title: t('landingCompositionTitle'), body: t('landingCompositionBody'), href: route(locale, '/docs/composition') },
  ];

  return (
    <div className="landing">
      <Meta description={t('siteTagline')} locale={locale} path="" siteTitle={t('siteTitle')} />

      <section className="hero">
        <div className="hero__text">
          <h1>{t('heroLead')}</h1>
          <p className="lead">{t('heroBody')}</p>

          <pre className="hero__install">
            <code>{t('heroInstall')}</code>
          </pre>

          <p className="hero__links">
            <Link to={route(locale, '/docs')}>{t('heroDocs')}</Link>
            <a href={REPOSITORY}>{t('heroGithub')}</a>
          </p>
        </div>

        <div className="hero__panel">
          <HeroPanel
            labels={{
              panel: t('heroPanelLabel'),
              tabs: t('heroPanelTabs', { returnObjects: true }) as [string, string, string],
              presets: t('heroPresetsLabel'),
              presetDefault: t('heroPresetDefault'),
            }}
          />
        </div>
      </section>

      <section className="promises">
        {promises.map((promise) => (
          <article key={promise.title}>
            <h2>
              <Link to={promise.href}>{promise.title}</Link>
            </h2>
            <p>{promise.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Landing;
