/** A heading and where its top edge currently sits, in viewport coordinates. */
export interface HeadingPosition {
  id: string;
  top: number;
}

export interface ActiveHeadingOptions {
  /** Height of the sticky header: a heading counts as passed once it goes under it. */
  headerOffset: number;
  /** True when the page cannot scroll any further. */
  atBottom: boolean;
}

/*
 * The whole scroll-spy rule, with no DOM in it, so it can be tested for the cases that are hard to
 * produce by hand: the very top, the very bottom, and a jump that skips several headings at once.
 *
 * The last heading whose top has passed under the header wins. Before the first one, the first
 * heading stays active rather than nothing being marked — a contents list with nothing current
 * reads as broken. At the bottom the last heading wins unconditionally, because a short final
 * section may never reach the line no matter how far the reader scrolls.
 */
export function activeHeading(
  positions: HeadingPosition[],
  { headerOffset, atBottom }: ActiveHeadingOptions,
): string | null {
  if (positions.length === 0) return null;
  if (atBottom) return positions[positions.length - 1]!.id;

  // A tolerance, so a heading resting exactly on the line counts as passed rather than flickering.
  const line = headerOffset + 8;

  let current = positions[0]!.id;
  for (const position of positions) {
    if (position.top <= line) current = position.id;
    else break;
  }

  return current;
}
