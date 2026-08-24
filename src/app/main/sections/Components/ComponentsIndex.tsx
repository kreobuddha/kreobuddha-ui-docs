import './Components.css';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import Meta from '@components/Meta/Meta';
import Breadcrumbs from '@components/Breadcrumbs/Breadcrumbs';
import { docHref, getDocs } from '@utils/content';
import type { Locale } from '@utils/i18n';

const ComponentsIndex = ({ locale }: { locale: Locale }) => {
  const { t } = useTranslation();
  const components = getDocs('components', locale);

  return (
    <article className="prose" data-pagefind-body data-pagefind-filter={`locale:${locale}`}>
      <Meta
        title={t('componentsTitle')}
        description={t('componentsIndexLead')}
        locale={locale}
        path="/components"
        siteTitle={t('siteTitle')}
      />

      <Breadcrumbs locale={locale} trail={[{ label: t('componentsTitle') }]} />
      <h1>{t('componentsTitle')}</h1>
      <p className="lead">{t('componentsIndexLead')}</p>

      <ul className="guide-index">
        {components.map((component) => (
          <li key={component.slug}>
            <Link to={docHref('components', locale, component.slug)}>{component.title}</Link>
            <p>{component.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
};

export default ComponentsIndex;
