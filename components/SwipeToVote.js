import { useRef, useState } from "react";
import { VoteHeart } from "@/components/SongVoteControls";
import { cn } from "@/lib/utils";

// How far a finger has to drag the row before letting go counts as a swipe
const SWIPE_DISTANCE = 80;
// Past this the row moves slower than the finger, so it feels like a limit
const MAX_DRAG = 120;

// Wraps a jam song row so it can be swiped on touch screens: swipe left to
// know, swipe right to love. The color underneath shows what letting go will
// do. Vertical drags still scroll the page, and mouse drags do nothing.
export default function SwipeToVote({ vote, disabled, onSwipe, children }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  // 'pending' until we know if the finger is moving sideways or up/down
  const mode = useRef(null);
  const justSwiped = useRef(false);

  const reset = () => {
    start.current = null;
    mode.current = null;
    setDragging(false);
    setDx(0);
  };

  const onPointerDown = (e) => {
    if (disabled || e.pointerType === 'mouse') return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    mode.current = 'pending';
  };

  const onPointerMove = (e) => {
    if (!start.current || e.pointerId !== start.current.id) return;
    const moveX = e.clientX - start.current.x;
    const moveY = e.clientY - start.current.y;
    if (mode.current === 'pending') {
      if (Math.abs(moveY) > 10 && Math.abs(moveY) > Math.abs(moveX)) {
        reset();
        return;
      }
      if (Math.abs(moveX) > 10) {
        mode.current = 'swipe';
        setDragging(true);
        // Keep getting moves if the finger leaves the row
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      }
    }
    if (mode.current === 'swipe') {
      const sign = Math.sign(moveX);
      const abs = Math.abs(moveX);
      setDx(sign * (abs <= MAX_DRAG ? abs : MAX_DRAG + (abs - MAX_DRAG) * 0.25));
    }
  };

  const onPointerUp = () => {
    if (mode.current === 'swipe') {
      if (Math.abs(dx) >= SWIPE_DISTANCE) onSwipe(dx < 0 ? 'left' : 'right');
      // The pointerup is followed by a click; don't let it open anything
      justSwiped.current = true;
      setTimeout(() => { justSwiped.current = false; }, 0);
    }
    reset();
  };

  const swipingLeft = dx < 0;
  const target = swipingLeft ? 'know' : 'love';
  const clearing = vote === target;
  const ready = Math.abs(dx) >= SWIPE_DISTANCE;
  const label = clearing ? 'Clear' : swipingLeft ? 'Know' : 'Love';

  return (
    <div className="relative overflow-hidden">
      {dx !== 0 && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center px-5 text-sm font-semibold text-white transition-colors',
            swipingLeft ? 'justify-end' : 'justify-start',
            clearing ? (ready ? 'bg-gray-500' : 'bg-gray-400')
              : swipingLeft ? (ready ? 'bg-primary' : 'bg-primary/60')
              : (ready ? 'bg-rose-500' : 'bg-rose-300')
          )}
        >
          <span className={cn('flex items-center gap-1.5 transition-transform', ready && 'scale-110')}>
            <VoteHeart fill={swipingLeft || clearing ? 'none' : 'full'} className="h-6 w-6" />
            {label}
          </span>
        </div>
      )}
      <div
        className={cn('relative bg-white', !dragging && 'transition-transform duration-200')}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        onClickCapture={(e) => {
          if (justSwiped.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
