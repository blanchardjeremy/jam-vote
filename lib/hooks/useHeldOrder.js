import { useState, useRef, useCallback, useEffect } from 'react';

// After you vote, keep the song list in the order you saw it for a few
// seconds, so a song doesn't jump away between taps (e.g. tapping twice to
// go from Know to Love). Each new vote restarts the wait. Counts still update
// right away; only the order waits.
export function useHeldOrder(delayMs = 5000) {
  const [held, setHeld] = useState(null); // Map of song id -> position
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // shownIds: the order on screen right now
  const hold = useCallback((shownIds) => {
    setHeld((prev) => prev ?? new Map(shownIds.map((id, i) => [id, i])));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHeld(null), delayMs);
  }, [delayMs]);

  // Put songs back in the held order; songs added meanwhile go last
  const applyHeld = useCallback((songs) => {
    if (!held || !songs) return songs;
    const pos = (s) => held.get(s._id) ?? Number.MAX_SAFE_INTEGER;
    return [...songs].sort((a, b) => pos(a) - pos(b));
  }, [held]);

  return { hold, applyHeld };
}
