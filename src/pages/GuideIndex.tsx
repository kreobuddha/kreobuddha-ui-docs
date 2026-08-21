import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Meta } from './Meta';
import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { getDocs } from '@/lib/content';
import { route } from '@/lib/links';
import type { Locale } from '@/lib/i18n';

export function GuideIndex({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const guides = getDocs('guides', locale);

  return (
    <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
      <Meta
        title={t('docsTitle')}
        description={t('guidesIndexLead')}
        locale={locale}
        path="/docs"
        siteTitle={t('siteTitle')}
      />

      <Breadcrumbs locale={locale} trail={[{ label: t('docsTitle') }]} />
      <h1>{t('docsTitle')}</h1>
      <p className="lead">{t('guidesIndexLead')}</p>

      {(['getting-started', 'foundations', 'patterns'] as const).map((group) => {
        const items = guides.filter((guide) => guide.group === group);
        if (items.length === 0) return null;

        return (
          <section key={group}>
            <h2>{t(`groups.${group}`)}</h2>
            <ul className="guide-index">
              {items.map((guide) => (
                <li key={guide.slug}>
                  <Link to={route(locale, `/docs/${guide.slug}`)}>{guide.title}</Link>
                  <p>{guide.description}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}
