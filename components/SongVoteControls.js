import { useId } from "react";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";
import { answerStatus, keys, storage } from "@/lib/utils/guideQueue";
import { cn } from "@/lib/utils";

// The room's counts for a song. Every heart also counts as a know, so
// `loves` is always part of `knows`, even for hearts given before knows were
// tracked. `youKnowIt` makes sure this device is counted at least once.
export function knowCounts(jamSong, youKnowIt = false) {
  const loves = jamSong.votes || 0;
  const knows = Math.max(jamSong.knows || 0, loves, youKnowIt ? 1 : 0);
  return { loves, knows };
}

// This device's vote on a song: 'love' | 'know' | 'dontKnow' | 'unanswered'.
// 'dontKnow' is shown as "I'm not sure".
export function yourVote(jamSong) {
  if (storage.get(keys.love(jamSong._id)) === 'true') return 'love';
  return answerStatus(jamSong);
}

// The localStorage keys each vote keeps set. Loving a song also counts as
// knowing it, so a love keeps the know key too.
const KEYS_FOR = {
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


// Each tap moves to the next step: empty heart -> I know it -> I love it ->
// empty heart. Going back to empty saves "I don't know it", so the song still
// counts as seen (no new-song dot, not offered again in guided voting).
const NEXT_VOTE = {
  unanswered: 'know',
  dontKnow: 'know',
  know: 'love',
  love: 'dontKnow',
};

const HEART_PATH =
  'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z';

// A heart outline, filled per vote: empty (no vote), left half purple
// (know it) or all rose (love it). Color comes from the parent's text color.
// An optional `count` is written in the middle of the heart.
export function VoteHeart({ fill = 'none', count, className }) {
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
      {count != null && (
        <text
          x="12"
          y="12.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={String(count).length > 2 ? 6 : 8}
          fontWeight="700"
          // Full heart: white number. Half heart: white with a colored edge so
          // it reads on both halves. Empty heart: the outline's color.
          fill={fill === 'none' ? 'currentColor' : 'white'}
          stroke={fill === 'half' ? 'currentColor' : 'none'}
          strokeWidth={fill === 'half' ? 2 : 0}
          paintOrder="stroke"
          className="tabular-nums"
        >
          {count}
        </text>
      )}
    </svg>
  );
}

const HEART_STYLE = {
  love: { fill: 'full', color: 'text-rose-500', label: 'You love it. Tap to clear your vote' },
  know: { fill: 'half', color: 'text-primary', label: 'You know it. Tap to love it' },
  dontKnow: { fill: 'none', color: 'text-gray-500', label: "You don't know it. Tap if you know it" },
  unanswered: { fill: 'none', color: 'text-gray-500', label: 'Not voted. Tap if you know it' },
};

// Swipe to know (left) or swipe to love (right). Swiping the same way again
// empties the heart and saves "I don't know it", like the third tap.
export function swipeVote(jamSong, vote, direction, { onVote, onKnow, onChange }) {
  const target = direction === 'left' ? 'know' : 'love';
  changeVote(jamSong._id, vote === target ? 'dontKnow' : target, { onVote, onKnow });
  onChange?.();
}

// The heart on each jam song, with the room's love count inside it. Tap to
// cycle your vote: know it (half purple) -> love it (full rose) -> empty (don't know).
export default function HeartToggle({ jamSong, vote, onVote, onKnow, onChange }) {
  const style = HEART_STYLE[vote] || HEART_STYLE.unanswered;
  const { loves, knows } = knowCounts(jamSong, vote === 'love' || vote === 'know');
  const countText = `${loves} love it, ${knows} know it`;
  const box = cn(
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-11 md:w-11',
    // Wait for this device's vote to load so the first render matches the server
    !vote && 'invisible'
  );
  const content = (
    <>
      <VoteHeart fill={style.fill} count={loves} className={cn('h-9 w-9', style.color)} />
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
    { fill: 'half', color: 'text-primary', text: 'I know it' },
    { fill: 'full', color: 'text-rose-500', text: 'I love it' },
  ];
  return (
    <div className={cn('space-y-1 text-sm text-gray-600', className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {items.map(({ fill, color, text }) => (
          <span key={text} className="inline-flex items-center gap-1.5">
            <VoteHeart fill={fill} className={cn('h-5 w-5', color)} />
            {text}
          </span>
        ))}
      </div>
      <p className="text-gray-500">Tap a heart, or swipe a song left to know or right to love</p>
    </div>
  );
}
