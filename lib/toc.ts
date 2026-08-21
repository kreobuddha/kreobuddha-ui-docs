export interface HeadingPosition {
  id: string;
  top: number;
}

export interface ActiveHeadingOptions {
  headerOffset: number;
  atBottom: boolean;
}

export function activeHeading(
  positions: HeadingPosition[],
  { headerOffset, atBottom }: ActiveHeadingOptions,
): string | null {
  if (positions.length === 0) return null;
  if (atBottom) return positions[positions.length - 1]!.id;

  const line = headerOffset + 8;

  let current = positions[0]!.id;
  for (const position of positions) {
    if (position.top <= line) current = position.id;
    else break;
  }

  return current;
}
