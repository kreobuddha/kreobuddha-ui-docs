'use client';

import { useEffect, useId, useState } from 'react';

import type { Heading } from '@/lib/mdx';
import { activeHeading } from '@/lib/toc';

const HEADER_OFFSET = 60;

export function Toc({ headings, label }: { headings: Heading[]; label: string }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const recompute = () => {
      setActiveId(
        activeHeading(
          elements.map((element) => ({ id: element.id, top: element.getBoundingClientRect().top })),
          {
            headerOffset: HEADER_OFFSET,
            atBottom:
              window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2,
          },
        ),
      );
    };

    let frame = 0;
    const onScroll = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };

    recompute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('hashchange', recompute);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', recompute);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label={label} data-open={isOpen ? 'true' : 'false'}>
      <button
        type="button"
        className="toc__toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {label}
      </button>

      <h2 className="toc__title" aria-hidden="true">
        {label}
      </h2>

      <div className="toc__panel" id={panelId}>
        <ul>
          {headings.map((heading) => (
            <li key={heading.id} data-depth={heading.depth}>
              <a
                href={`#${heading.id}`}
                aria-current={heading.id === activeId ? 'true' : undefined}
                onClick={() => setIsOpen(false)}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
