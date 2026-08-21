'use client';

import { useState } from 'react';

import type { PlaygroundSpec } from './types';
import { Button, Dialog, Select, Tabs, TextField, ToastProvider, useToast } from '@/components/ui';
import { serializeJsx, type PropValue } from '@/lib/jsx';

const sizes = ['sm', 'md', 'lg'];

export const specs: Record<string, PlaygroundSpec> = {
  button: {
    element: 'Button',
    children: 'Save changes',
    defaults: { variant: 'filled', size: 'md', danger: false, loading: false, disabled: false },
    controls: [
      { prop: 'variant', label: 'Variant', kind: 'choice', choices: ['filled', 'outlined', 'ghost'] },
      { prop: 'size', label: 'Size', kind: 'choice', choices: sizes },
      { prop: 'danger', label: 'Danger', kind: 'boolean' },
      { prop: 'loading', label: 'Loading', kind: 'boolean' },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: (props) => <Button {...props}>Save changes</Button>,
  },

  'text-field': {
    element: 'TextField',
    defaults: {
      label: 'Billing email',
      size: 'md',
      hint: 'Receipts are sent here.',
      error: '',
      required: false,
      disabled: false,
    },
    always: ['label'],
    controls: [
      { prop: 'label', label: 'Label', kind: 'text' },
      { prop: 'size', label: 'Size', kind: 'choice', choices: sizes },
      { prop: 'hint', label: 'Hint', kind: 'text' },
      { prop: 'error', label: 'Error', kind: 'text' },
      { prop: 'required', label: 'Required', kind: 'boolean' },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: ({ error, hint, ...props }) => (
      <TextField
        {...props}
        label={String(props['label'] ?? '')}
        hint={hint === '' ? undefined : hint}
        error={error === '' ? undefined : error}
      />
    ),
  },

  select: {
    element: 'Select',
    defaults: {
      label: 'Environment',
      size: 'md',
      placeholder: 'Choose one',
      disabled: false,
    },
    always: ['label'],
    controls: [
      { prop: 'size', label: 'Size', kind: 'choice', choices: sizes },
      { prop: 'placeholder', label: 'Placeholder', kind: 'text' },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: (props) => (
      <Select {...props} label={String(props['label'] ?? '')}>
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
      </Select>
    ),
    code: (props) =>
      `${serializeJsx('Select', props, {
        defaults: { label: 'Environment', size: 'md', placeholder: 'Choose one', disabled: false },
        always: ['label'],
        children: '…',
      }).replace(
        '…',
        '\n  <option value="production">Production</option>\n' +
          '  <option value="staging">Staging</option>\n' +
          '  <option value="development">Development</option>\n',
      )}`,
  },

  tabs: {
    element: 'Tabs',
    defaults: { activation: 'automatic' },
    controls: [
      {
        prop: 'activation',
        label: 'Activation',
        kind: 'choice',
        choices: ['automatic', 'manual'],
      },
    ],
    render: (props) => (
      <Tabs
        {...props}
        activation={props['activation'] === 'manual' ? 'manual' : 'automatic'}
        items={[
          { id: 'logs', label: 'Logs', content: <p>The last hundred lines, newest first.</p> },
          { id: 'metrics', label: 'Metrics', content: <p>Requests, errors and latency.</p> },
          { id: 'config', label: 'Config', content: <p>The values this deployment was given.</p> },
        ]}
      />
    ),
    code: (props) =>
      [
        'const items = [',
        "  { id: 'logs', label: 'Logs', content: <Logs /> },",
        "  { id: 'metrics', label: 'Metrics', content: <Metrics /> },",
        "  { id: 'config', label: 'Config', content: <Config /> },",
        '];',
        '',
        serializeJsx('Tabs', { ...props, items: undefined }, {
          defaults: { activation: 'automatic' },
        }).replace('<Tabs', '<Tabs items={items}'),
      ].join('\n'),
  },

  dialog: {
    element: 'Dialog',
    defaults: {
      title: 'Delete this project?',
      size: 'md',
      dismissible: true,
      dismissOnBackdrop: true,
    },
    always: ['title'],
    controls: [
      { prop: 'size', label: 'Size', kind: 'choice', choices: sizes },
      { prop: 'dismissible', label: 'Dismissible', kind: 'boolean' },
      { prop: 'dismissOnBackdrop', label: 'Close on backdrop', kind: 'boolean' },
    ],
    render: (props) => {
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button onClick={() => setOpen(true)}>Open the dialog</Button>
          <Dialog
            {...props}
            title={String(props['title'] ?? '')}
            open={open}
            onClose={() => setOpen(false)}
            description="Everything in it goes with it. This cannot be undone."
            footer={
              <>
                <Button variant="outlined" onClick={() => setOpen(false)}>
                  Keep it
                </Button>
                <Button danger onClick={() => setOpen(false)}>
                  Delete
                </Button>
              </>
            }
          />
        </>
      );
    },
    code: (props) =>
      [
        'const [open, setOpen] = useState(false);',
        '',
        serializeJsx('Dialog', { ...props, open: undefined }, {
          defaults: {
            title: 'Delete this project?',
            size: 'md',
            dismissible: true,
            dismissOnBackdrop: true,
          },
          always: ['title'],
        }).replace('<Dialog', '<Dialog\n  open={open}\n  onClose={() => setOpen(false)}'),
      ].join('\n'),
  },

  toast: {
    element: 'toast',
    defaults: { tone: 'success', title: 'Deployment finished', duration: 5000 },
    controls: [
      {
        prop: 'tone',
        label: 'Tone',
        kind: 'choice',
        choices: ['success', 'info', 'warning', 'danger'],
      },
      { prop: 'title', label: 'Title', kind: 'text' },
    ],
    render: (props) => (
      <ToastProvider>
        <RaiseToast {...props} />
      </ToastProvider>
    ),
    code: (props) =>
      [
        'const { toast } = useToast();',
        '',
        'toast({',
        `  tone: '${String(props['tone'])}',`,
        `  title: '${String(props['title'])}',`,
        "  children: 'Two services updated, none failed.',",
        '});',
      ].join('\n'),
  },
};

function RaiseToast(props: Record<string, PropValue>) {
  const { toast } = useToast();

  return (
    <Button
      onClick={() =>
        toast({
          tone: props['tone'] as 'success' | 'info' | 'warning' | 'danger',
          title: String(props['title'] ?? ''),
          children: 'Two services updated, none failed.',
        })
      }
    >
      Raise a toast
    </Button>
  );
}
