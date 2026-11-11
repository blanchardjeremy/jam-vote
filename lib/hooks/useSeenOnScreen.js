import { useEffect, useRef } from 'react';

// Calls `onSeen` once the element has been mostly on screen (60%) for
// `delayMs` without a break, so a quick scroll past doesn't count. Only
// watches while `enabled`.
export function useSeenOnScreen(enabled, onSeen, delayMs = 1000) {
  const ref = useRef(null);
  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    let timer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          timer = setTimeout(() => {
            observer.disconnect();
            onSeenRef.current();
          }, delayMs);
        }
      },
      { threshold: [0, 0.6] }
    );
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, delayMs]);

  return ref;
}
