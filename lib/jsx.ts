export type PropValue = string | number | boolean | undefined;

export interface SerializeOptions {
  defaults?: Record<string, PropValue>;
  children?: string;
  always?: string[];
}

const WIDTH = 84;

function attribute(name: string, value: PropValue): string | null {
  if (value === undefined || value === false) return null;
  if (value === true) return name;
  if (typeof value === 'number') return `${name}={${value}}`;
  return `${name}="${value}"`;
}

export function serializeJsx(
  element: string,
  props: Record<string, PropValue>,
  { defaults = {}, children, always = [] }: SerializeOptions = {},
): string {
  const attributes = Object.entries(props)
    .filter(([name, value]) => always.includes(name) || value !== defaults[name])
    .map(([name, value]) => attribute(name, value))
    .filter((written): written is string => written !== null);

  const open = `<${element}`;
  const inline = attributes.length === 0 ? '' : ` ${attributes.join(' ')}`;
  const oneLine =
    children === undefined
      ? `${open}${inline} />`
      : `${open}${inline}>${children}</${element}>`;

  if (oneLine.length <= WIDTH) return oneLine;

  const indented = attributes.map((written) => `  ${written}`).join('\n');
  return children === undefined
    ? `${open}\n${indented}\n/>`
    : `${open}\n${indented}\n>\n  ${children}\n</${element}>`;
}
