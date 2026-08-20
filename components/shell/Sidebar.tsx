'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { GuideMeta } from '@/lib/content';
import type { GroupId } from '@/lib/nav';
import { route } from '@/lib/links';
import type { Locale } from '@/lib/i18n';

export interface SidebarGroup {
  id: GroupId;
  label: string;
  items: Pick<GuideMeta, 'slug' | 'title'>[];
}

const COLLAPSED_KEY = 'kb-docs-sidebar-collapsed';
const SCROLL_KEY = 'kb-docs-sidebar-scroll';

function readCollapsed(): string[] {
  try {
    const raw = sessionStorage.getItem(COLLAPSED_KEY) ?? localStorage.getItem(COLLAPSED_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function Sidebar({
  locale,
  groups,
  label,
}: {
  locale: Locale;
  groups: SidebarGroup[];
  label: string;
}) {
  const pathname = usePathname();
  const scroller = useRef<HTMLElement>(null);

  /*
   * Collapsed sections start empty on the server and on the first client render, and only then
   * take the stored value. Reading storage during render would make the markup depend on the
   * reader's machine, which is the definition of a hydration mismatch.
   */
  const [collapsed, setCollapsed] = useState<string[]>([]);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const toggle = useCallback((id: GroupId) => {
    setCollapsed((current) => {
      const next = current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id];
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        // A reader with storage blocked loses the memory, not the sidebar.
      }
      return next;
    });
  }, []);

  /*
   * Scroll position survives navigation.
   *
   * This is the detail that gives a documentation sidebar away. The reader scrolls to a link near
   * the bottom of a long tree, clicks it, and the new page re-mounts the sidebar at the top — so
   * every step through a section costs them the scroll they already did. Restoring it in a layout
   * effect puts it back before the browser paints, so there is no visible jump.
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
      // Same as above: the sidebar works, it just forgets.
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
    <nav className="sidebar" aria-label={label} ref={scroller} onScroll={rememberScroll}>
      {groups.map((group) => {
        const isCollapsed = collapsed.includes(group.id);
        const listId = `sidebar-${group.id}`;

        return (
          <section className="sidebar__group" key={group.id}>
            <h2>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={listId}
                onClick={() => toggle(group.id)}
              >
                <span className="sidebar__chevron" aria-hidden="true" />
                {group.label}
              </button>
            </h2>

            {/*
              Hidden rather than unmounted: `hidden` keeps the list out of the accessibility tree
              and out of the tab order, and `aria-controls` above stays pointing at something that
              exists.
            */}
            <ul id={listId} hidden={isCollapsed}>
              {group.items.map((item) => {
                const href = route(locale, `/docs/${item.slug}`);
                const isCurrent = pathname === href || pathname === `${href}/`;

                return (
                  <li key={item.slug}>
                    <Link href={href} aria-current={isCurrent ? 'page' : undefined}>
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
