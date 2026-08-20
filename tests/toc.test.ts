import assert from 'node:assert/strict';
import { test } from 'node:test';

import { activeHeading, type HeadingPosition } from '../lib/toc.ts';

const options = { headerOffset: 60, atBottom: false };

const page: HeadingPosition[] = [
  { id: 'first', top: -400 },
  { id: 'second', top: -120 },
  { id: 'third', top: 300 },
];

test('nothing to mark when the page has no headings', () => {
  assert.equal(activeHeading([], options), null);
});

test('the first heading stays active above it', () => {
  const tops: HeadingPosition[] = [
    { id: 'first', top: 500 },
    { id: 'second', top: 900 },
  ];
  assert.equal(activeHeading(tops, options), 'first');
});

test('the last heading that passed under the header is the active one', () => {
  assert.equal(activeHeading(page, options), 'second');
});

test('a heading resting exactly on the line counts as passed', () => {
  const tops: HeadingPosition[] = [
    { id: 'first', top: -10 },
    { id: 'second', top: 68 },
    { id: 'third', top: 400 },
  ];
  assert.equal(activeHeading(tops, options), 'second');
});

test('a jump that skips several headings lands on the right one', () => {
  const tops: HeadingPosition[] = [
    { id: 'a', top: -3000 },
    { id: 'b', top: -2000 },
    { id: 'c', top: -1000 },
    { id: 'd', top: -20 },
    { id: 'e', top: 900 },
  ];
  assert.equal(activeHeading(tops, options), 'd');
});

test('at the bottom the last heading wins, however short its section', () => {
  const tops: HeadingPosition[] = [
    { id: 'first', top: -800 },
    { id: 'second', top: -400 },
    // Never reaches the line: the page ends before it can.
    { id: 'third', top: 500 },
  ];
  assert.equal(activeHeading(tops, { ...options, atBottom: true }), 'third');
});
