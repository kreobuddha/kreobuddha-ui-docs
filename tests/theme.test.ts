import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  changedTokens,
  decodeTheme,
  encodeTheme,
  exportCss,
  resolveTokenValue,
} from '../lib/theme.ts';

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

test('a theme is what was changed, not everything that exists', () => {
  const changed = changedTokens(
    { '--kreo-accent-500': '#2f5d8c', '--kreo-text-body': '#16181d' },
    { '--kreo-accent-500': '#93357f', '--kreo-text-body': '#16181d' },
  );
  assert.deepEqual(changed, { '--kreo-accent-500': '#2f5d8c' });
});

test('case does not make a colour a change', () => {
  const changed = changedTokens({ '--kreo-accent-500': '#93357F' }, { '--kreo-accent-500': '#93357f' });
  assert.deepEqual(changed, {});
});

test('a theme survives the round trip through a link', () => {
  const theme = { '--kreo-accent-500': '#2f5d8c', '--kreo-surface-page': '#f7f8f9' };
  assert.deepEqual(decodeTheme(`#${encodeTheme(theme)}`), theme);
});

test('an unchanged theme produces no fragment at all', () => {
  assert.equal(encodeTheme({}), '');
});

test('a fragment that is not a theme is ignored', () => {
  assert.deepEqual(decodeTheme('#section-heading'), {});
  assert.deepEqual(decodeTheme(''), {});
});

test('a link cannot smuggle in a token the editor does not offer', () => {
  assert.deepEqual(decodeTheme('#theme=shadow-overlay:ff0000'), {});
});

test('a link cannot smuggle in a value that is not a colour', () => {
  assert.deepEqual(decodeTheme('#theme=accent-500:url(evil)'), {});
  assert.deepEqual(decodeTheme('#theme=accent-500:red'), {});
});

test('one bad entry does not throw away the good ones beside it', () => {
  assert.deepEqual(decodeTheme('#theme=accent-500:2f5d8c,shadow-overlay:ff0000'), {
    '--kreo-accent-500': '#2f5d8c',
  });
});

test('the exported CSS carries only what was changed', () => {
  assert.equal(
    exportCss({ '--kreo-accent-500': '#2f5d8c' }),
    ':root {\n  --kreo-accent-500: #2f5d8c;\n}',
  );
});

test('an untouched theme exports a note rather than an empty rule', () => {
  assert.equal(exportCss({}), '/* Nothing changed yet. */');
});
