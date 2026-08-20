'use client';

import { useEffect, useRef, useState } from 'react';

/** Below this the header is always shown: near the top there is nothing to reclaim. */
const REVEAL_ABOVE = 120;
/** Ignore jitter and rubber-banding; only a deliberate move counts as a direction. */
const MIN_DELTA = 8;

/*
 * The header gets out of the way when the reader scrolls down and comes back the moment they
 * scroll up. On a phone it is the difference between a 60px band of chrome following you down a
 * long guide and the guide having the screen.
 *
 * It stays put whenever focus is inside it: a keyboard user tabbing through the header must not
 * have it slide away underneath them.
 */
export function AutoHideHeader({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const holdsFocus = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    let frame = 0;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (Math.abs(delta) >= MIN_DELTA) {
        lastY.current = y;
        setHidden(!holdsFocus.current && delta > 0 && y > REVEAL_ABOVE);
      } else if (y <= REVEAL_ABOVE) {
        setHidden(false);
      }
    };

    const onScroll = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      className="site-header"
      data-hidden={hidden ? 'true' : 'false'}
      onFocusCapture={() => {
        holdsFocus.current = true;
        setHidden(false);
      }}
      onBlurCapture={() => {
        holdsFocus.current = false;
      }}
    >
      {children}
    </header>
  );
}
