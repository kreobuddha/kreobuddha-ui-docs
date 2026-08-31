import type { ReactNode } from 'react';

import { Alert } from '@components/ui';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const Callout = ({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) => (
  <Alert tone={tone} {...(title === undefined ? {} : { title })}>
    {children}
  </Alert>
);

export default Callout;
