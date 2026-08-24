import { useTranslation } from 'react-i18next';

import type { Locale } from '@utils/i18n';

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

const PropsTable = ({ rows, locale = 'en' }: { rows: PropRow[]; locale?: Locale }) => {
  const { t } = useTranslation();

  return (
    <div className="table-scroll">
      <table className="props-table">
        <thead data-pagefind-ignore>
          <tr>
            <th scope="col">{t('propName')}</th>
            <th scope="col">{t('propType')}</th>
            <th scope="col">{t('propDefault')}</th>
            <th scope="col">{t('propDescription')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
                {row.required ? (
                  <span className="props-table__required"> {t('required')}</span>
                ) : null}
              </th>
              <td data-label={t('propType')}>
                <code>{row.type}</code>
              </td>
              <td data-label={t('propDefault')}>
                {row.default === undefined ? <span aria-hidden="true">—</span> : <code>{row.default}</code>}
              </td>
              <td data-label={t('propDescription')}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PropsTable;
