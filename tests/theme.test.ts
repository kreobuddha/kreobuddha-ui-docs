import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveTokenValue } from '../lib/theme.ts';

test('a token that is already a colour resolves to itself', () => {
  const values = new Map([['--kreo-accent-500', '#93357f']]);
  assert.equal(resolveTokenValue(values, '--kreo-accent-500'), '#93357f');
});

test('a reference is followed to the colour at the end of it', () => {
  const values = new Map([
    ['--kreo-surface-card', 'var(--kreo-neutral-0)'],
    ['--kreo-neutral-0', '#ffffff'],
  ]);
  assert.equal(resolveTokenValue(values, '--kreo-surface-card'), '#ffffff');
});

test('a reference going round in a circle gives up instead of hanging', () => {
  const values = new Map([
    ['--kreo-a', 'var(--kreo-b)'],
    ['--kreo-b', 'var(--kreo-a)'],
  ]);
  assert.equal(resolveTokenValue(values, '--kreo-a'), null);
});

test('a reference to something that does not exist resolves to nothing', () => {
  const values = new Map([['--kreo-a', 'var(--kreo-missing)']]);
  assert.equal(resolveTokenValue(values, '--kreo-a'), null);
});
