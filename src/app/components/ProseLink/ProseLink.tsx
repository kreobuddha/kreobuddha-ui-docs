import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';

const ProseLink = ({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) =>
  href !== undefined && href.startsWith('/') ? (
    <Link to={href} {...rest}>
      {children}
    </Link>
  ) : (
    <a href={href} {...rest}>
      {children}
    </a>
  );

export default ProseLink;
