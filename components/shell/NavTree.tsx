import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
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

export function NavTree({ groups, onNavigate }: { groups: NavGroupData[]; onNavigate?: () => void }) {
  const pathname = useLocation().pathname;

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

            <ul id={listId} hidden={isCollapsed}>
              {group.items.map((item) => {
                const isCurrent = pathname === item.href || pathname === `${item.href}/`;

                return (
                  <li key={item.slug}>
                    <Link
                      to={item.href}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={onNavigate}
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
