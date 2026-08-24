import { useCallback, useLayoutEffect, useRef } from 'react';

import NavTree, { type NavGroupData } from '@components/NavTree/NavTree';

const SCROLL_KEY = 'kb-docs-sidebar-scroll';

const Sidebar = ({ groups, label }: { groups: NavGroupData[]; label: string }) => {
  const scroller = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;

    try {
      const stored = sessionStorage.getItem(SCROLL_KEY);
      if (stored !== null) element.scrollTop = Number(stored);
    } catch {
    }
  }, []);

  const rememberScroll = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    try {
      sessionStorage.setItem(SCROLL_KEY, String(element.scrollTop));
    } catch {
    }
  }, []);

  return (
    <nav className="sidebar nav-tree" aria-label={label} ref={scroller} onScroll={rememberScroll}>
      <NavTree groups={groups} />
    </nav>
  );
};

export default Sidebar;
