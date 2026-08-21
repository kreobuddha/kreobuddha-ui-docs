'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { NavTree, type NavGroupData } from './NavTree';

/** How far a horizontal drag has to travel before it counts as a dismissal rather than a tap. */
const SWIPE_THRESHOLD = 60;

/*
 * The navigation on a narrow screen.
 *
 * Built on `<dialog>` and `showModal()`, which is not a shortcut: the platform gives the focus
 * trap, `Escape`, the inert background and the top layer, and every one of those is a thing
 * hand-rolled drawers get subtly wrong. What is left to write is what the platform does not do —
 * dismissing on a click outside, dismissing on a swipe, locking the page behind it, and returning
 * focus to the trigger, which `showModal` does for `Escape` but not for our own closes.
 */
export function NavDrawer({
  groups,
  label,
  openLabel,
  closeLabel,
  theme,
}: {
  groups: NavGroupData[];
  label: string;
  openLabel: string;
  closeLabel: string;
  /** The theme control, which the header has no room for at this width. */
  theme?: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<number | null>(null);
  const scrollAtOpen = useRef(0);
  const swiped = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => {
    dialog.current?.close();
  }, []);

  const open = useCallback(() => {
    // Read before opening: `showModal` moves focus into the dialog, and moving focus scrolls the
    // page to reach it. By the time an effect runs, the position worth restoring is already gone.
    scrollAtOpen.current = window.scrollY;
    dialog.current?.showModal();
    setIsOpen(true);
  }, []);

  /*
   * The page behind a modal must not scroll.
   *
   * `overflow: hidden` on the root is the usual answer and it is wrong here: making the scroll
   * container non-scrollable clamps its offset to zero, so opening the drawer throws the reader
   * back to the top of the guide and closing it leaves them there. Pinning the body at a negative
   * offset holds the page exactly where it was, and the position is handed back on close.
   *
   * Nothing shifts sideways: `scrollbar-gutter: stable` in `base.css` has already reserved the
   * scrollbar's width whether or not there is one.
   */
  useEffect(() => {
    if (!isOpen) return;

    const y = scrollAtOpen.current;
    const { style } = document.body;
    const previous = { position: style.position, top: style.top, insetInline: style.insetInline };

    style.position = 'fixed';
    style.top = `-${y}px`;
    style.insetInline = '0';

    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.insetInline = previous.insetInline;
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  // Following a link closes the drawer. The route changes under it otherwise, leaving the reader
  // looking at the navigation for a page they are already on.
  useEffect(() => {
    close();
  }, [pathname, close]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    // `showModal` restores focus to the trigger when the dialog is dismissed with `Escape`, but not
    // when it is closed from script. Doing it unconditionally is harmless and covers both.
    trigger.current?.focus();
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDialogElement>) => {
    /*
     * No pointer capture here, though a drag usually wants one. Capturing on the dialog retargets
     * the release — and therefore the click — away from whatever was pressed, which turns every
     * link in the drawer into dead text. The drag is tracked by bubbling instead, and a gesture
     * that leaves the dialog entirely simply never completes.
     */
    dragStart.current = event.clientX;
  };

  // The browser can take the gesture over — a pinch, or a scroll it decides was the intent. The
  // drag is abandoned rather than completed on whatever coordinate it was cancelled at.
  const onPointerCancel = () => {
    dragStart.current = null;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDialogElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    // The drawer comes in from the left, so it leaves the same way.
    if (start !== null && start - event.clientX > SWIPE_THRESHOLD) {
      // A swipe usually ends on top of a link, and the browser will follow it. Someone dismissing
      // the drawer asked to go nowhere.
      swiped.current = true;
      close();
    }
  };

  /*
   * A click on the backdrop lands on the dialog element itself, because the backdrop is not a node
   * of its own. Comparing the target is how the two are told apart without an extra overlay
   * element sitting over the page.
   */
  const onClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (swiped.current) {
      swiped.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.target === dialog.current) close();
  };

  return (
    <>
      <button
        type="button"
        className="nav-drawer__trigger"
        ref={trigger}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={open}
      >
        <span className="nav-drawer__bars" aria-hidden="true" />
        {openLabel}
      </button>

      <dialog
        className="nav-drawer"
        ref={dialog}
        aria-label={label}
        onClose={onClose}
        onClickCapture={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="nav-drawer__panel nav-tree">
          <button type="button" className="nav-drawer__close" onClick={close}>
            {closeLabel}
          </button>

          <nav aria-label={label}>
            <NavTree groups={groups} onNavigate={close} />
          </nav>

          {theme === undefined ? null : <div className="nav-drawer__theme">{theme}</div>}
        </div>
      </dialog>
    </>
  );
}
