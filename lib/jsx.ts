/** A prop value the serialiser knows how to write back as JSX. */
export type PropValue = string | number | boolean | undefined;

export interface SerializeOptions {
  /** Values equal to these are left out: writing a default back is noise, not information. */
  defaults?: Record<string, PropValue>;
  /** Literal text between the tags. */
  children?: string;
  /** Props to write even when they equal their default, because the example needs them to work. */
  always?: string[];
}

const WIDTH = 84;

function attribute(name: string, value: PropValue): string | null {
  if (value === undefined || value === false) return null;
  // `<Button disabled>` rather than `<Button disabled={true}>`: the shorthand is what anyone
  // writing this by hand would write.
  if (value === true) return name;
  if (typeof value === 'number') return `${name}={${value}}`;
  return `${name}="${value}"`;
}

/*
 * Turns the playground's current state back into the JSX someone would paste into their own code.
 *
 * A serialiser, not a compiler: it writes source out of values that are already known. The
 * playground never parses anything, never evaluates a string, and ships no compiler to the reader.
 */
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

  // Too wide to read on one line, so one prop per line — the shape the same code would take after
  // a formatter had seen it.
  const indented = attributes.map((written) => `  ${written}`).join('\n');
  return children === undefined
    ? `${open}\n${indented}\n/>`
    : `${open}\n${indented}\n>\n  ${children}\n</${element}>`;
}
