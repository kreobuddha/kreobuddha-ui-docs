import assert from 'node:assert/strict';
import { test } from 'node:test';

import { serializeJsx } from '../lib/jsx.ts';

test('a component with nothing set is written bare', () => {
  assert.equal(serializeJsx('Spinner', {}), '<Spinner />');
});

test('defaults are left out, because writing them back says nothing', () => {
  const code = serializeJsx('Button', { variant: 'filled', size: 'md' }, {
    defaults: { variant: 'filled', size: 'md' },
    children: 'Save',
  });
  assert.equal(code, '<Button>Save</Button>');
});

test('a changed value is written even when another is left at its default', () => {
  const code = serializeJsx('Button', { variant: 'outlined', size: 'md' }, {
    defaults: { variant: 'filled', size: 'md' },
    children: 'Save',
  });
  assert.equal(code, '<Button variant="outlined">Save</Button>');
});

test('booleans use the shorthand, and false disappears', () => {
  assert.equal(
    serializeJsx('Button', { loading: true, disabled: false }, { children: 'Save' }),
    '<Button loading>Save</Button>',
  );
});

test('numbers keep their braces', () => {
  assert.equal(serializeJsx('Progress', { value: 40 }), '<Progress value={40} />');
});

test('a prop marked always is written even at its default', () => {
  const code = serializeJsx('TextField', { label: 'Email' }, {
    defaults: { label: 'Email' },
    always: ['label'],
  });
  assert.equal(code, '<TextField label="Email" />');
});

test('a line too long to read breaks onto one prop per line', () => {
  const code = serializeJsx(
    'TextField',
    { label: 'Billing email address', hint: 'We only use it for receipts', size: 'lg' },
    { always: ['label'] },
  );
  assert.equal(
    code,
    [
      '<TextField',
      '  label="Billing email address"',
      '  hint="We only use it for receipts"',
      '  size="lg"',
      '/>',
    ].join('\n'),
  );
});

test('children survive the break onto several lines', () => {
  const code = serializeJsx(
    'Button',
    { variant: 'outlined', size: 'lg', fullWidth: true, danger: true },
    { children: 'Delete this project for everyone' },
  );
  assert.equal(
    code,
    [
      '<Button',
      '  variant="outlined"',
      '  size="lg"',
      '  fullWidth',
      '  danger',
      '>',
      '  Delete this project for everyone',
      '</Button>',
    ].join('\n'),
  );
});
