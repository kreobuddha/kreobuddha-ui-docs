import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contrastLevel, contrastRatio, parseHex } from '../lib/contrast.ts';

const ratio = (foreground: string, background: string): number =>
  contrastRatio(parseHex(foreground)!, parseHex(background)!);

test('shorthand and longhand hex parse to the same colour', () => {
  assert.deepEqual(parseHex('#fff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseHex('#ffffff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseHex('123456'), { r: 18, g: 52, b: 86 });
});

test('anything that is not a colour is refused rather than guessed at', () => {
  assert.equal(parseHex('rebeccapurple'), null);
  assert.equal(parseHex('#12345'), null);
  assert.equal(parseHex(''), null);
});

test('black on white is the maximum the scale allows', () => {
  assert.equal(Math.round(ratio('#000000', '#ffffff')), 21);
});

test('a colour against itself is the minimum', () => {
  assert.equal(ratio('#3d7fd1', '#3d7fd1'), 1);
});

test('the ratio does not depend on which colour is named first', () => {
  assert.equal(ratio('#595959', '#ffffff'), ratio('#ffffff', '#595959'));
});

test('#595959 on white is the canonical 7:1 boundary', () => {
  // The value WCAG's own examples use for the AAA threshold.
  assert.ok(Math.abs(ratio('#595959', '#ffffff') - 7) < 0.05);
});

test('levels follow the thresholds, not the other way round', () => {
  assert.equal(contrastLevel(21), 'AAA');
  assert.equal(contrastLevel(7), 'AAA');
  assert.equal(contrastLevel(6.99), 'AA');
  assert.equal(contrastLevel(4.5), 'AA');
  assert.equal(contrastLevel(4.49), 'AA Large');
  assert.equal(contrastLevel(3), 'AA Large');
  assert.equal(contrastLevel(2.99), 'fail');
});

test('large text passes at three and reaches AAA at four and a half', () => {
  assert.equal(contrastLevel(3, true), 'AA');
  assert.equal(contrastLevel(4.5, true), 'AAA');
  assert.equal(contrastLevel(2.99, true), 'fail');
});
