import { useId } from "react";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";
import { answerStatus, keys, storage } from "@/lib/utils/guideQueue";
import { cn } from "@/lib/utils";

// This device's vote on a song: 'love' | 'know' | 'dontKnow' | 'unanswered'.
// 'dontKnow' is shown as "I'm not sure".
export function yourVote(jamSong) {
  if (storage.get(keys.love(jamSong._id)) === 'true') return 'love';
  return answerStatus(jamSong);
}

// The localStorage keys each vote keeps set. Loving a song also counts as
// knowing it, so a love keeps the know key too.
const KEYS_FOR = {
  unanswered: [],
  love: ['love', 'know'],
  know: ['know'],
  dontKnow: ['dontKnow'],
};

// What the server is told when a key is added or taken away
const SERVER = {
  love: { add: ['vote', 'vote'], remove: ['vote', 'unvote'] },
  know: { add: ['know', 'know'], remove: ['know', 'unknow'] },
  dontKnow: { add: ['know', 'dontknow'], remove: ['know', 'undontknow'] },
};

// Change this device's vote, undoing whatever the old vote added, so each
// person is counted once. Matches how guided voting records answers.
function changeVote(id, next, { onVote, onKnow }) {
  const send = (kind, action) => {
    const fn = kind === 'vote' ? onVote : onKnow;
    if (fn) Promise.resolve(fn(id, action)).catch(() => {});
  };
  const wanted = KEYS_FOR[next];

  // Take back what the new vote doesn't keep
  for (const key of Object.keys(keys)) {
    if (wanted.includes(key) || storage.get(keys[key](id)) !== 'true') continue;
    storage.remove(keys[key](id));
    if (SERVER[key]) send(...SERVER[key].remove);
  }

  // Back to no vote: everything above was taken back already
  if (wanted.length === 0) return;

  if (next === 'love') {
    storage.set(keys.love(id), 'true');
    send('vote', 'vote');
    // A heart also counts as a know (once per person)
    alsoMarkKnownForLove(
      id,
      (songId) => onKnow?.(songId, 'know'),
      (songId) => onKnow?.(songId, 'undontknow')
    );
    return;
  }
  const [key] = wanted;
  if (storage.get(keys[key](id)) === 'true') return;
  storage.set(keys[key](id), 'true');
  if (SERVER[key]) send(...SERVER[key].add);
}


// Each tap moves to the next step: no vote -> I know it -> I love it -> no
// vote. "I'm not sure" (from guided voting) starts the cycle like no vote.
const NEXT_VOTE = {
  unanswered: 'know',
  dontKnow: 'know',
  know: 'love',
  love: 'unanswered',
};

const HEART_PATH =
  'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z';

// A heart outline, filled per vote: empty (no vote), left half blue
// (know it) or all rose (love it). Color comes from the parent's text color.
export function VoteHeart({ fill = 'none', className }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      {fill === 'half' && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}
      {fill !== 'none' && (
        <path
          d={HEART_PATH}
          fill="currentColor"
          clipPath={fill === 'half' ? `url(#${clipId})` : undefined}
        />
      )}
      <path d={HEART_PATH} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

const HEART_STYLE = {
  love: { fill: 'full', color: 'text-rose-500', label: 'You love it. Tap to clear your vote' },
  know: { fill: 'half', color: 'text-blue-500', label: 'You know it. Tap to love it' },
  dontKnow: { fill: 'none', color: 'text-gray-400', label: "You're not sure. Tap if you know it" },
  unanswered: { fill: 'none', color: 'text-gray-400', label: 'Not voted. Tap if you know it' },
};

// Swipe to know (left) or swipe to love (right). Swiping the same way again
// clears your vote, like tapping the heart round to No vote.
export function swipeVote(jamSong, vote, direction, { onVote, onKnow, onChange }) {
  const target = direction === 'left' ? 'know' : 'love';
  changeVote(jamSong._id, vote === target ? 'unanswered' : target, { onVote, onKnow });
  onChange?.();
}

// The heart on each jam song, with the number of hearts under it. Tap to
// cycle your vote: know it (half blue) -> love it (full rose) -> no vote.
export default function HeartToggle({ jamSong, vote, onVote, onKnow, onChange }) {
  const style = HEART_STYLE[vote] || HEART_STYLE.unanswered;
  const count = jamSong.votes || 0;
  const countText = `${count} ${count === 1 ? 'heart' : 'hearts'}`;
  const box = cn(
    'flex w-10 shrink-0 flex-col items-center justify-center rounded-lg py-1 md:w-11',
    // Wait for this device's vote to load so the first render matches the server
    !vote && 'invisible'
  );
  const content = (
    <>
      <VoteHeart fill={style.fill} className={cn('h-6 w-6', style.color)} />
      <span className={cn('text-xs font-medium tabular-nums', vote === 'love' ? 'text-rose-600' : 'text-gray-500')}>
        {count}
      </span>
    </>
  );

  // Played songs can't be voted on any more
  if (jamSong.played) {
    return (
      <div className={box} role="img" aria-label={countText}>
        {content}
      </div>
    );
  }

  const tap = (e) => {
    e.stopPropagation();
    changeVote(jamSong._id, NEXT_VOTE[vote] || 'know', { onVote, onKnow });
    onChange?.();
  };

  return (
    <button
      type="button"
      aria-label={`${style.label}. ${countText}`}
      onClick={tap}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        box,
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        '[@media(hover:hover)]:hover:bg-gray-100'
      )}
    >
      {content}
    </button>
  );
}

// Explains the heart icons; shown above the jam list
export function HeartLegend({ className }) {
  const items = [
    { fill: 'none', color: 'text-gray-400', text: 'Not voted' },
    { fill: 'half', color: 'text-blue-500', text: 'I know it' },
    { fill: 'full', color: 'text-rose-500', text: 'I love it' },
  ];
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600', className)}>
      {items.map(({ fill, color, text }) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          <VoteHeart fill={fill} className={cn('h-5 w-5', color)} />
          {text}
        </span>
      ))}
      <span className="text-gray-500">Tap a heart, or swipe a song left to know or right to love</span>
    </div>
  );
}
