import type { ComponentType } from 'react';

import type { PropValue } from '@/lib/jsx';

export type ControlSpec =
  | { prop: string; label: string; kind: 'boolean' }
  | { prop: string; label: string; kind: 'choice'; choices: string[] }
  | { prop: string; label: string; kind: 'text' };

export interface PlaygroundSpec {
  element: string;
  controls: ControlSpec[];
  defaults: Record<string, PropValue>;
  children?: string;
  always?: string[];
  render: ComponentType<Record<string, PropValue>>;
  code?: (props: Record<string, PropValue>) => string;
}
