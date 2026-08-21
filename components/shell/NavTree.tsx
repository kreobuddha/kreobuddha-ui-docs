'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { GroupId, NavItem } from '@/lib/nav';

export interface NavGroupData {
  id: GroupId;
  label: string;
  items: NavItem[];
}

const COLLAPSED_KEY = 'kb-docs-sidebar-collapsed';

function readCollapsed(): string[] {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/*
 * The tree itself, drawn the same way in the rail and in the mobile drawer. One component, so the
 * two cannot drift apart — and collapsing a section on the phone is still collapsed on the desktop,
 * because both read the same stored list.
 */
export function NavTree({ groups, onNavigate }: { groups: NavGroupData[]; onNavigate?: () => void }) {
  const pathname = usePathname();

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
        // A reader with storage blocked loses the memory, not the navigation.
      }
      return next;
    });
  }, []);

  return (
    <>
      {groups.map((group) => {
        const isCollapsed = collapsed.includes(group.id);
        const listId = `nav-${group.id}`;

        return (
          <section className="nav-tree__group" key={group.id}>
            <h2>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={listId}
                onClick={() => toggle(group.id)}
              >
                <span className="nav-tree__chevron" aria-hidden="true" />
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
                const isCurrent = pathname === item.href || pathname === `${item.href}/`;

                return (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={onNavigate}
                      /*
                       * Dragging a navigation link is never the intent, and letting the browser
                       * start its own drag cancels the pointer stream — which is how the drawer's
                       * swipe to dismiss dies the moment a finger lands on a link rather than on
                       * the gap between two.
                       */
                      draggable={false}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
