import type { ReactNode } from 'react';

import { Accordion } from '@components/ui';

// One section rather than a bare <details>: the library already owns this, and a documentation
// site that reimplements what it documents is arguing against itself.
const Details = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => <Accordion items={[{ id, label, content: children }]} />;

export default Details;
