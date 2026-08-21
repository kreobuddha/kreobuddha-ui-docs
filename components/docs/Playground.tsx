'use client';

import { useMemo, useState } from 'react';

import { specs } from './playground/specs';
import type { ControlSpec } from './playground/types';
import { Select, Switch, TextField } from '@/components/ui';
import { serializeJsx, type PropValue } from '@/lib/jsx';

function Control({
  control,
  value,
  onChange,
}: {
  control: ControlSpec;
  value: PropValue;
  onChange: (next: PropValue) => void;
}) {
  switch (control.kind) {
    case 'boolean':
      return (
        <Switch
          label={control.label}
          checked={value === true}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      );
    case 'choice':
      return (
        <Select
          label={control.label}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          {control.choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </Select>
      );
    case 'text':
      return (
        <TextField
          label={control.label}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      );
  }
}

/*
 * A live component, the controls that drive it, and the code that would produce what is on screen.
 *
 * The code is written out of the current values by a serialiser — there is no compiler in the
 * browser, nothing is parsed, and nothing is evaluated. What the reader copies is what they would
 * have typed.
 */
export function Playground({
  id,
  label,
  codeLabel,
}: {
  id: string;
  label: string;
  codeLabel: string;
}) {
  const spec = specs[id];
  if (spec === undefined) {
    throw new Error(
      `No playground called '${id}'. Add it to components/docs/playground/specs.tsx, or fix the ` +
        'name in the MDX.',
    );
  }

  const [props, setProps] = useState<Record<string, PropValue>>(spec.defaults);

  const code = useMemo(
    () =>
      spec.code
        ? spec.code(props)
        : serializeJsx(spec.element, props, {
            defaults: spec.defaults,
            children: spec.children,
            always: spec.always,
          }),
    [spec, props],
  );

  const View = spec.render;

  return (
    <section className="playground" aria-label={label}>
      {/*
        The scope the theme editor will write into. Nothing overrides a token here yet; what
        matters now is that the preview is already the only place that would be affected.
      */}
      <div className="playground__preview preview-scope">
        <View {...props} />
      </div>

      <div className="playground__controls">
        {spec.controls.map((control) => (
          <Control
            key={control.prop}
            control={control}
            value={props[control.prop]}
            onChange={(next) => setProps((current) => ({ ...current, [control.prop]: next }))}
          />
        ))}
      </div>

      <figure className="playground__code">
        <figcaption>{codeLabel}</figcaption>
        <pre>
          <code>{code}</code>
        </pre>
      </figure>
    </section>
  );
}
