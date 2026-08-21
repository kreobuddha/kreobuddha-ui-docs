'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';

import { NavTree, type NavGroupData } from './NavTree';
import type { Locale } from '@/lib/i18n';

const SCROLL_KEY = 'kb-docs-sidebar-scroll';

export type SidebarGroup = NavGroupData;

export function Sidebar({
  locale,
  groups,
  label,
}: {
  locale: Locale;
  groups: NavGroupData[];
  label: string;
}) {
  const scroller = useRef<HTMLElement>(null);

  /*
   * Scroll position survives navigation.
   *
   * This is the detail that gives a documentation sidebar away. The reader scrolls to a link near
   * the bottom of a long tree, clicks it, and the new page re-mounts the rail at the top — so every
   * step through a section costs them the scroll they already did. Restoring it in a layout effect
   * puts it back before the browser paints, so there is no visible jump.
   *
   * It is written to `sessionStorage`, not `localStorage`: it belongs to this visit. Coming back
   * tomorrow should start at the top of the tree.
   */
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;

    try {
      const stored = sessionStorage.getItem(SCROLL_KEY);
      if (stored !== null) element.scrollTop = Number(stored);
    } catch {
      // A reader with storage blocked loses the memory, not the sidebar.
    }
  }, []);

  const rememberScroll = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    try {
      sessionStorage.setItem(SCROLL_KEY, String(element.scrollTop));
    } catch {
      // Ignored deliberately.
    }
  }, []);

  return (
    <nav className="sidebar nav-tree" aria-label={label} ref={scroller} onScroll={rememberScroll}>
      <NavTree locale={locale} groups={groups} />
    </nav>
  );
}
