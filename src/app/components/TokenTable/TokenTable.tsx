import { selectTokens } from '@utils/tokens';

type TokenPreview = 'none' | 'swatch' | 'bar' | 'radius' | 'text';

interface TokenTableProps {
  include?: string[];
  exclude?: string[];
  preview?: TokenPreview;
}

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

const TokenTable = async ({ include, exclude, preview = 'none' }: TokenTableProps) => {
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
                  <Sample name={name} preview={preview} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;
