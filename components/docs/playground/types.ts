import type { ComponentType } from 'react';

import type { PropValue } from '@/lib/jsx';

export type ControlSpec =
  | { prop: string; label: string; kind: 'boolean' }
  | { prop: string; label: string; kind: 'choice'; choices: string[] }
  | { prop: string; label: string; kind: 'text' };

export interface PlaygroundSpec {
  /** The name written into the generated code. */
  element: string;
  controls: ControlSpec[];
  /** The state the example starts in, and the values the generated code leaves out. */
  defaults: Record<string, PropValue>;
  /** Literal text between the tags, when the component takes children. */
  children?: string;
  /** Props written into the code even at their default, because the example needs them. */
  always?: string[];
  render: ComponentType<Record<string, PropValue>>;
  /** For components whose real usage is more than one tag — a hook, a state, a list of items. */
  code?: (props: Record<string, PropValue>) => string;
}
