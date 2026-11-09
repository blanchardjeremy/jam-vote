import { useState, useRef } from 'react';

// Dropdown menus normally open on finger-down, so a scroll that starts on the
// button would open them. For touch, open only on a tap that didn't move
// (a scroll fires pointercancel, so pointerup never arrives for it).
// Mouse clicks behave as usual. Same behavior as the jam row's ⋮ menu.
export function useTapToOpenMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const tapStart = useRef(null);

  const triggerProps = {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse') return;
      e.preventDefault();
      tapStart.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e) => {
      const start = tapStart.current;
      tapStart.current = null;
      if (!start) return;
      if (Math.abs(e.clientX - start.x) < 10 && Math.abs(e.clientY - start.y) < 10) {
        setIsOpen(true);
      }
    },
    onPointerCancel: () => {
      tapStart.current = null;
    },
  };

  return { isOpen, setIsOpen, triggerProps };
}
