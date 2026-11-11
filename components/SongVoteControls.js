import { keys, storage, voteStatus } from "@/lib/utils/guideQueue";
import { cn } from "@/lib/utils";

// This device's vote on a song: 'voted' | 'seen' | 'new'
export const yourVote = voteStatus;

// Vote for a song, or take the vote back. Taking it back still leaves the
// song marked seen, so it doesn't come back as new.
export function toggleVote(jamSong, vote, { onVote, onChange }) {
  const id = jamSong._id;
  const voted = vote === 'voted';
  if (voted) {
    storage.remove(keys.vote(id));
    storage.set(keys.seen(id), 'true');
  } else {
    storage.set(keys.vote(id), 'true');
  }
  if (onVote) Promise.resolve(onVote(id, voted ? 'unvote' : 'vote')).catch(() => {});
  onChange?.();
}

// Tapping a new song's row marks it seen, so it loses its new-song dot
export function markSeen(jamSong, vote, { onChange }) {
  if (vote !== 'new' || jamSong.played) return;
  storage.set(keys.seen(jamSong._id), 'true');
  onChange?.();
}

const HEART_PATH =
  'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z';

// A heart outline, filled when `filled`. Color comes from the parent's text color.
export function VoteHeart({ filled = false, className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      {filled && <path d={HEART_PATH} fill="currentColor" />}
      <path d={HEART_PATH} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// The heart on each jam song, with the vote count under it. One tap votes,
// another takes the vote back.
export default function HeartToggle({ jamSong, vote, onVote, onChange }) {
  const voted = vote === 'voted';
  const votes = jamSong.votes || 0;
  const countText = `${votes} ${votes === 1 ? 'vote' : 'votes'}`;
  const box = cn(
    'flex w-10 shrink-0 flex-col items-center justify-center rounded-lg py-1 md:w-11',
    // Wait for this device's vote to load so the first render matches the server
    !vote && 'invisible'
  );
  const content = (
    <>
      <VoteHeart filled={voted} className={cn('h-6 w-6', voted ? 'text-rose-500' : 'text-gray-500')} />
      <span aria-hidden className={cn('text-xs font-medium tabular-nums', voted ? 'text-rose-600' : 'text-gray-500')}>
        {votes}
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

  return (
    <button
      type="button"
      aria-label={`${voted ? 'Remove your vote' : 'Vote'}. ${countText}`}
      aria-pressed={voted}
      onClick={(e) => {
        e.stopPropagation();
        toggleVote(jamSong, vote, { onVote, onChange });
      }}
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
