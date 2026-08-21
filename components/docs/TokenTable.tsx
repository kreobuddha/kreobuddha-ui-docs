import { selectTokens } from '@/lib/tokens';

/** The sample rendered beside the value. `none` leaves the column out. */
export type TokenPreview = 'none' | 'swatch' | 'bar' | 'radius' | 'text';

export interface TokenTableProps {
  /** Keep tokens whose name starts with one of these prefixes, `--kreo-` included. */
  include?: string[];
  /** Drop tokens whose name starts with one of these prefixes. Applied after `include`. */
  exclude?: string[];
  preview?: TokenPreview;
}

/*
 * A server component with no client JavaScript: the sample is drawn by handing the token straight
 * back to CSS as `var(--kreo-…)`, so the browser resolves it — including under a theme this table
 * knows nothing about. Nothing here reads a computed value.
 */
function Sample({ name, preview }: { name: string; preview: TokenPreview }) {
  const token = `var(${name})`;

  switch (preview) {
    case 'swatch':
      return <span className="token-sample token-sample--swatch" style={{ background: token }} />;
    case 'bar':
      return <span className="token-sample token-sample--bar" style={{ inlineSize: token }} />;
    case 'radius':
      return <span className="token-sample token-sample--radius" style={{ borderRadius: token }} />;
    case 'text':
      return (
        <span className="token-sample token-sample--text" style={{ font: token }}>
          Ag
        </span>
      );
    case 'none':
      return null;
  }
}

export async function TokenTable({ include, exclude, preview = 'none' }: TokenTableProps) {
  const tokens = await selectTokens(include, exclude);
  const showSample = preview !== 'none';

  return (
    <div className="table-scroll">
      <table className="token-table">
        <thead data-pagefind-ignore>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
            {showSample ? <th scope="col">Sample</th> : null}
          </tr>
        </thead>
        <tbody>
          {tokens.map(({ name, value }) => (
            <tr key={name}>
              <th scope="row">
                <code>{name}</code>
              </th>
              <td data-label="Value">
                <code>{value}</code>
              </td>
              {showSample ? (
                <td data-label="Sample" data-pagefind-ignore>
                  {/* Decorative: the value is already in the previous cell. */}
                  <Sample name={name} preview={preview} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
