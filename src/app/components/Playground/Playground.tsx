import { useMemo, useState } from 'react';

import { specs } from './specs';
import type { ControlSpec } from './types';
import { Select, Switch, TextField } from '@components/ui';
import { serializeJsx, type PropValue } from '@utils/jsx';

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

const Playground = ({
  id,
  label,
  codeLabel,
}: {
  id: string;
  label: string;
  codeLabel: string;
}) => {
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
        <figcaption data-pagefind-ignore>{codeLabel}</figcaption>
        <pre>
          <code>{code}</code>
        </pre>
      </figure>
    </section>
  );
};

export default Playground;
