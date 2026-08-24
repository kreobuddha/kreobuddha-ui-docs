import { useTranslation } from 'react-i18next';

import Meta from '@components/Meta/Meta';
import Breadcrumbs from '@components/Breadcrumbs/Breadcrumbs';
import TokenTable from '@components/TokenTable/TokenTable';
import type { Locale } from '@utils/i18n';

const Tokens = ({ locale }: { locale: Locale }) => {
  const { t } = useTranslation();

  const sections = [
    { id: 'colour', heading: t('tokensColour'), include: ['--kreo-neutral-', '--kreo-accent-', '--kreo-danger-', '--kreo-success-', '--kreo-warning-', '--kreo-info-'], preview: 'swatch' as const },
    { id: 'surface', heading: t('tokensSurface'), include: ['--kreo-surface-'], preview: 'swatch' as const },
    { id: 'text', heading: t('tokensText'), include: ['--kreo-text-'], exclude: ['--kreo-text-12', '--kreo-text-16', '--kreo-text-24', '--kreo-text-36'], preview: 'swatch' as const },
    { id: 'border', heading: t('tokensBorder'), include: ['--kreo-border-', '--kreo-icon-'], preview: 'swatch' as const },
    { id: 'type', heading: t('tokensType'), include: ['--kreo-type-', '--kreo-text-1', '--kreo-text-2', '--kreo-text-3', '--kreo-font-', '--kreo-weight-', '--kreo-leading-', '--kreo-tracking-', '--kreo-numeric-'], preview: 'none' as const },
    { id: 'space', heading: t('tokensSpace'), include: ['--kreo-space-', '--kreo-control-'], preview: 'bar' as const },
    { id: 'shape', heading: t('tokensShape'), include: ['--kreo-radius-'], preview: 'radius' as const },
    { id: 'motion', heading: t('tokensMotion'), include: ['--kreo-duration-', '--kreo-ease', '--kreo-transition-'], preview: 'none' as const },
  ];

  return (
    <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
      <Meta
        title={t('tokensTitle')}
        description={t('tokensLead')}
        locale={locale}
        path="/tokens"
        siteTitle={t('siteTitle')}
      />

      <Breadcrumbs locale={locale} trail={[{ label: t('tokensTitle') }]} />
      <h1>{t('tokensTitle')}</h1>
      <p className="lead">{t('tokensLead')}</p>

      {sections.map((section) => (
        <section key={section.id}>
          <h2 id={section.id}>{section.heading}</h2>
          <TokenTable include={section.include} exclude={section.exclude} preview={section.preview} />
        </section>
      ))}
    </article>
  );
};

export default Tokens;
