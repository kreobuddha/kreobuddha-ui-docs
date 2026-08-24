import { light, dark, tokens as all } from 'virtual:tokens';

export interface Token {
  name: string;
  value: string;
}

export function resolveTokenValue(
  map: Map<string, string>,
  name: string,
  seen = new Set<string>(),
): string | null {
  if (seen.has(name)) return null;
  seen.add(name);

  const value = map.get(name);
  if (value === undefined) return null;

  const reference = /^var\(\s*(--kreo-[\w-]+)/.exec(value);
  return reference ? resolveTokenValue(map, reference[1], seen) : value;
}

export function selectTokens(include?: string[], exclude?: string[]): Token[] {
  const kept = all.filter(({ name }) => {
    const included = include === undefined || include.some((prefix) => name.startsWith(prefix));
    const excluded = exclude !== undefined && exclude.some((prefix) => name.startsWith(prefix));
    return included && !excluded;
  });

  if (kept.length === 0) {
    throw new Error(
      `No tokens matched include=${JSON.stringify(include)} exclude=${JSON.stringify(exclude)}. ` +
        'A table that lists nothing is a renamed token, not an empty section.',
    );
  }

  return kept;
}

export const pageColours = {
  light: resolveTokenValue(light, '--kreo-surface-page') ?? '#ffffff',
  dark: resolveTokenValue(dark, '--kreo-surface-page') ?? '#000000',
};
