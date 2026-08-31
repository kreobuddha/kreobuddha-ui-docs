import { useState } from 'react';

import type { PlaygroundSpec } from './types';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Checkbox,
  Dialog,
  FieldGroup,
  IconButton,
  Progress,
  Radio,
  Select,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  TextField,
  ToastProvider,
  Toggletip,
  Tooltip,
  useToast,
} from '@components/ui';
import { serializeJsx, type PropValue } from '@utils/jsx';

const sizes = ['sm', 'md', 'lg'];

const PLACEMENTS = ['top', 'bottom', 'left', 'right'];

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8h6l.5-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function placementOf(value: unknown): 'top' | 'bottom' | 'left' | 'right' {
  return value === 'bottom' || value === 'left' || value === 'right' ? value : 'top';
}

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

  accordion: {
    element: 'Accordion',
    defaults: { exclusive: false },
    controls: [{ prop: 'exclusive', label: 'One at a time', kind: 'boolean' }],
    render: (props) => (
      <Accordion
        {...props}
        exclusive={props['exclusive'] === true}
        items={[
          {
            id: 'build',
            label: 'Build',
            content: <p>Compiled the package and ran the type check.</p>,
            defaultOpen: true,
          },
          { id: 'test', label: 'Test', content: <p>Ran the suite in a real browser.</p> },
          { id: 'deploy', label: 'Deploy', content: <p>Published the static output.</p> },
        ]}
      />
    ),
    code: (props) =>
      [
        'const items = [',
        "  { id: 'build', label: 'Build', content: <Build />, defaultOpen: true },",
        "  { id: 'test', label: 'Test', content: <Test /> },",
        "  { id: 'deploy', label: 'Deploy', content: <Deploy /> },",
        '];',
        '',
        serializeJsx('Accordion', props, { defaults: { exclusive: false } }).replace(
          '<Accordion',
          '<Accordion items={items}',
        ),
      ].join('\n'),
  },

  spinner: {
    element: 'Spinner',
    defaults: { size: 'md', label: '' },
    controls: [
      { prop: 'size', label: 'Size', kind: 'choice', choices: sizes },
      { prop: 'label', label: 'Label', kind: 'text' },
    ],
    render: ({ label, ...props }) => (
      <Spinner {...props} {...(label === '' ? {} : { label: String(label) })} />
    ),
    code: ({ label, ...props }) =>
      serializeJsx(
        'Spinner',
        { ...props, label: label === '' ? undefined : label },
        { defaults: { size: 'md' } },
      ),
  },

  alert: {
    element: 'Alert',
    children: 'The last deploy did not finish. Nothing was published.',
    defaults: { tone: 'info', title: '', live: false, dismissible: false },
    controls: [
      {
        prop: 'tone',
        label: 'Tone',
        kind: 'choice',
        choices: ['info', 'success', 'warning', 'danger'],
      },
      { prop: 'title', label: 'Title', kind: 'text' },
      { prop: 'live', label: 'Announce', kind: 'boolean' },
      { prop: 'dismissible', label: 'Dismissible', kind: 'boolean' },
    ],
    render: ({ dismissible, title, ...props }) => (
      <Alert
        {...props}
        title={title === '' ? undefined : String(title)}
        {...(dismissible === true ? { onDismiss: () => undefined, dismissLabel: 'Dismiss' } : {})}
      >
        The last deploy did not finish. Nothing was published.
      </Alert>
    ),
    code: ({ dismissible, title, ...props }) =>
      serializeJsx(
        'Alert',
        { ...props, title: title === '' ? undefined : title },
        {
          defaults: { tone: 'info', live: false },
          children: 'The last deploy did not finish. Nothing was published.',
        },
      ).replace('<Alert', dismissible === true ? '<Alert onDismiss={dismiss}' : '<Alert'),
  },

  tooltip: {
    element: 'Tooltip',
    defaults: { content: 'Rebuild without the cache', placement: 'top' },
    always: ['content'],
    controls: [
      { prop: 'content', label: 'Content', kind: 'text' },
      { prop: 'placement', label: 'Placement', kind: 'choice', choices: PLACEMENTS },
    ],
    render: (props) => (
      <Tooltip
        content={String(props['content'] ?? '')}
        placement={placementOf(props['placement'])}
      >
        <Button variant="outlined">Rebuild</Button>
      </Tooltip>
    ),
    code: (props) =>
      serializeJsx('Tooltip', props, {
        defaults: { placement: 'top' },
        always: ['content'],
        children: '<Button variant="outlined">Rebuild</Button>',
      }),
  },

  toggletip: {
    element: 'Toggletip',
    defaults: {
      content: 'Runs the migrations before the new build takes traffic.',
      placement: 'top',
    },
    always: ['content'],
    controls: [
      { prop: 'content', label: 'Content', kind: 'text' },
      { prop: 'placement', label: 'Placement', kind: 'choice', choices: PLACEMENTS },
    ],
    render: (props) => (
      <Toggletip
        content={String(props['content'] ?? '')}
        placement={placementOf(props['placement'])}
      >
        <Button variant="ghost">What is this?</Button>
      </Toggletip>
    ),
    code: (props) =>
      serializeJsx('Toggletip', props, {
        defaults: { placement: 'top' },
        always: ['content'],
        children: '<Button variant="ghost">What is this?</Button>',
      }),
  },

  badge: {
    element: 'Badge',
    children: 'Staging',
    defaults: { tone: 'neutral', dot: false },
    controls: [
      {
        prop: 'tone',
        label: 'Tone',
        kind: 'choice',
        choices: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
      },
      { prop: 'dot', label: 'Dot', kind: 'boolean' },
    ],
    render: (props) => <Badge {...props}>Staging</Badge>,
  },

  progress: {
    element: 'Progress',
    defaults: { label: 'Uploading files', value: '40' },
    always: ['label'],
    controls: [
      { prop: 'label', label: 'Label', kind: 'text' },
      {
        prop: 'value',
        label: 'Value',
        kind: 'choice',
        choices: ['0', '25', '40', '75', '100', 'indeterminate'],
      },
    ],
    render: ({ value, ...props }) => (
      <Progress
        {...props}
        label={String(props['label'] ?? '')}
        value={value === 'indeterminate' ? undefined : Number(value)}
      />
    ),
    code: (props) =>
      serializeJsx(
        'Progress',
        {
          ...props,
          value: props['value'] === 'indeterminate' ? undefined : Number(props['value']),
        },
        { always: ['label', 'value'] },
      ),
  },

  switch: {
    element: 'Switch',
    defaults: {
      label: 'Run migrations first',
      hint: 'Applied before the new build starts.',
      error: '',
      disabled: false,
    },
    always: ['label'],
    controls: [
      { prop: 'label', label: 'Label', kind: 'text' },
      { prop: 'hint', label: 'Hint', kind: 'text' },
      { prop: 'error', label: 'Error', kind: 'text' },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: ({ error, hint, ...props }) => (
      <Switch
        {...props}
        label={String(props['label'] ?? '')}
        hint={hint === '' ? undefined : hint}
        error={error === '' ? undefined : error}
      />
    ),
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

  checkbox: {
    element: 'Checkbox',
    defaults: {
      label: 'Email me when a build fails',
      hint: '',
      error: '',
      indeterminate: false,
      disabled: false,
    },
    always: ['label'],
    controls: [
      { prop: 'label', label: 'Label', kind: 'text' },
      { prop: 'hint', label: 'Hint', kind: 'text' },
      { prop: 'error', label: 'Error', kind: 'text' },
      { prop: 'indeterminate', label: 'Indeterminate', kind: 'boolean' },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: ({ error, hint, ...props }) => (
      <Checkbox
        {...props}
        label={String(props['label'] ?? '')}
        hint={hint === '' ? undefined : hint}
        error={error === '' ? undefined : error}
      />
    ),
  },

  'field-group': {
    element: 'FieldGroup',
    defaults: {
      legend: 'What should the deploy notify?',
      hint: 'Choose at least one.',
      error: '',
      orientation: 'vertical',
      disabled: false,
    },
    always: ['legend'],
    controls: [
      { prop: 'legend', label: 'Legend', kind: 'text' },
      { prop: 'hint', label: 'Group hint', kind: 'text' },
      { prop: 'error', label: 'Group error', kind: 'text' },
      {
        prop: 'orientation',
        label: 'Orientation',
        kind: 'choice',
        choices: ['vertical', 'horizontal'],
      },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: ({ error, hint, ...props }) => (
      <FieldGroup
        {...props}
        legend={String(props['legend'] ?? '')}
        hint={hint === '' ? undefined : hint}
        error={error === '' ? undefined : error}
        orientation={props['orientation'] === 'horizontal' ? 'horizontal' : 'vertical'}
      >
        <Checkbox name="notify" value="email" label="Email" defaultChecked />
        <Checkbox name="notify" value="chat" label="Chat" />
        <Checkbox name="notify" value="webhook" label="Webhook" />
      </FieldGroup>
    ),
    code: (props) =>
      serializeJsx(
        'FieldGroup',
        { ...props, error: props['error'] === '' ? undefined : props['error'] },
        {
          defaults: { orientation: 'vertical', disabled: false },
          always: ['legend'],
          children: '…',
        },
      ).replace(
        '…',
        '\n  <Checkbox name="notify" value="email" label="Email" defaultChecked />\n' +
          '  <Checkbox name="notify" value="chat" label="Chat" />\n' +
          '  <Checkbox name="notify" value="webhook" label="Webhook" />\n',
      ),
  },

  radio: {
    element: 'FieldGroup',
    defaults: { legend: 'Deploy target', orientation: 'vertical', disabled: false },
    always: ['legend'],
    controls: [
      { prop: 'legend', label: 'Legend', kind: 'text' },
      {
        prop: 'orientation',
        label: 'Orientation',
        kind: 'choice',
        choices: ['vertical', 'horizontal'],
      },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: (props) => (
      <FieldGroup
        {...props}
        legend={String(props['legend'] ?? '')}
        orientation={props['orientation'] === 'horizontal' ? 'horizontal' : 'vertical'}
      >
        <Radio name="target" value="production" label="Production" defaultChecked />
        <Radio name="target" value="staging" label="Staging" />
        <Radio name="target" value="preview" label="Preview" />
      </FieldGroup>
    ),
    code: (props) =>
      serializeJsx('FieldGroup', props, {
        defaults: { orientation: 'vertical', disabled: false },
        always: ['legend'],
        children: '…',
      }).replace(
        '…',
        '\n  <Radio name="target" value="production" label="Production" defaultChecked />\n' +
          '  <Radio name="target" value="staging" label="Staging" />\n' +
          '  <Radio name="target" value="preview" label="Preview" />\n',
      ),
  },

  'icon-button': {
    element: 'IconButton',
    defaults: {
      label: 'Remove member',
      variant: 'ghost',
      size: 'md',
      danger: false,
      loading: false,
      disabled: false,
    },
    always: ['label'],
    controls: [
      { prop: 'label', label: 'Label', kind: 'text' },
      { prop: 'variant', label: 'Variant', kind: 'choice', choices: ['filled', 'outlined', 'ghost'] },
      { prop: 'size', label: 'Size', kind: 'choice', choices: ['xs', 'sm', 'md', 'lg'] },
      { prop: 'danger', label: 'Danger', kind: 'boolean' },
      { prop: 'loading', label: 'Loading', kind: 'boolean' },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: (props) => (
      <IconButton {...props} label={String(props['label'] ?? '')} icon={<TrashIcon />} />
    ),
    code: (props) =>
      serializeJsx('IconButton', props, {
        defaults: {
          variant: 'ghost',
          size: 'md',
          danger: false,
          loading: false,
          disabled: false,
        },
        always: ['label'],
      }).replace('<IconButton', '<IconButton icon={<TrashIcon />}'),
  },

  textarea: {
    element: 'Textarea',
    defaults: {
      label: 'Release notes',
      size: 'md',
      rows: '4',
      hint: 'Markdown is supported.',
      error: '',
      resize: 'vertical',
      disabled: false,
    },
    always: ['label'],
    controls: [
      { prop: 'label', label: 'Label', kind: 'text' },
      { prop: 'size', label: 'Size', kind: 'choice', choices: sizes },
      { prop: 'rows', label: 'Rows', kind: 'choice', choices: ['2', '4', '8'] },
      { prop: 'hint', label: 'Hint', kind: 'text' },
      { prop: 'error', label: 'Error', kind: 'text' },
      { prop: 'resize', label: 'Resize', kind: 'choice', choices: ['vertical', 'none'] },
      { prop: 'disabled', label: 'Disabled', kind: 'boolean' },
    ],
    render: ({ error, hint, rows, ...props }) => (
      <Textarea
        {...props}
        label={String(props['label'] ?? '')}
        rows={Number(rows)}
        resize={props['resize'] === 'none' ? 'none' : 'vertical'}
        hint={hint === '' ? undefined : hint}
        error={error === '' ? undefined : error}
        fullWidth
      />
    ),
    code: ({ rows, ...props }) =>
      serializeJsx(
        'Textarea',
        { ...props, rows: Number(rows), fullWidth: true },
        {
          defaults: {
            size: 'md',
            hint: 'Markdown is supported.',
            error: '',
            resize: 'vertical',
            disabled: false,
            rows: 4,
          },
          always: ['label'],
        },
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
