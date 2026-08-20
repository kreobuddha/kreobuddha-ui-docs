'use client';

import { useEffect, useState } from 'react';

import type { Heading } from '@/lib/mdx';
import { activeHeading } from '@/lib/toc';

/** Height of the sticky header, in pixels. Kept in step with `--shell-header-height`. */
const HEADER_OFFSET = 60;

export function Toc({ headings, label }: { headings: Heading[]; label: string }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    // The rule itself lives in `lib/toc.ts`, with no DOM in it, so the cases that matter — the
    // top, the bottom, and a jump that skips several headings — are covered by tests instead of
    // by scrolling and looking.
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

    /*
     * Driven by the scroll event rather than by an IntersectionObserver, which is what the plan
     * assumed. Two reasons, in order of weight.
     *
     * The observer would only ever have been a trigger — the answer is worked out from the rects
     * either way — and a passive listener collapsed onto an animation frame does the same work at
     * the same cost, once per painted frame at most.
     *
     * The second reason is that an observer delivers nothing while the document is hidden, which
     * is exactly the state a headless browser leaves it in. A behaviour that cannot be measured
     * cannot be claimed, and this one is the reason the table of contents exists.
     */
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
    <nav className="toc" aria-label={label}>
      <h2 className="toc__title">{label}</h2>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id} data-depth={heading.depth}>
            <a
              href={`#${heading.id}`}
              aria-current={heading.id === activeId ? 'true' : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
