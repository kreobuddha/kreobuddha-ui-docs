import { dictionary, type Locale } from '@/lib/i18n';

export interface PropRow {
  name: string;
  type: string;
  /** Left out when the prop is required — a required prop has no default to state. */
  default?: string;
  required?: boolean;
  description: string;
}

/*
 * Written by hand, on purpose.
 *
 * Generating these from the types was considered and dropped: it is a build problem rather than a
 * documentation one, and what it produces is every declared prop in declaration order, which is
 * not the order anyone needs to read them in. The cost is that a table can drift from the code,
 * which is why the coverage is deliberately small.
 *
 * Inherited DOM attributes are not listed. A `Button` accepts everything a `<button>` accepts;
 * spelling out two hundred of them per component would bury the ten that matter. An inherited
 * attribute appears only when the component makes a decision about it.
 */
export function PropsTable({ rows, locale = 'en' }: { rows: PropRow[]; locale?: Locale }) {
  const t = dictionary[locale];

  return (
    <div className="table-scroll">
      <table className="props-table">
        <thead>
          <tr>
            <th scope="col">{t.propName}</th>
            <th scope="col">{t.propType}</th>
            <th scope="col">{t.propDefault}</th>
            <th scope="col">{t.propDescription}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
                {row.required ? (
                  <span className="props-table__required"> {t.required}</span>
                ) : null}
              </th>
              <td data-label={t.propType}>
                <code>{row.type}</code>
              </td>
              <td data-label={t.propDefault}>
                {row.default === undefined ? <span aria-hidden="true">—</span> : <code>{row.default}</code>}
              </td>
              <td data-label={t.propDescription}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
