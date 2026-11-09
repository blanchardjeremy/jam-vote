import { useState } from "react";
import { HeartIcon, CheckIcon } from "@heroicons/react/20/solid";
import { QuestionMarkCircleIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";
import { answerStatus, keys, storage } from "@/lib/utils/guideQueue";
import { cn } from "@/lib/utils";

// This device's vote on a song: 'love' | 'know' | 'dontKnow' | 'unsure' | 'unanswered'
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
  unsure: ['unsure'],
};

// What the server is told when a key is added or taken away. "Not sure" is
// only remembered on this device.
const SERVER = {
  love: { add: ['vote', 'vote'], remove: ['vote', 'unvote'] },
  know: { add: ['know', 'know'], remove: ['know', 'unknow'] },
  dontKnow: { add: ['know', 'dontknow'], remove: ['know', 'undontknow'] },
  unsure: null,
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
  for (const key of Object.keys(KEYS_FOR)) {
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

const OPTIONS = [
  { id: 'love', label: 'I love it', icon: HeartIcon, iconClass: 'text-rose-500' },
  { id: 'know', label: 'I know it', icon: CheckIcon, iconClass: 'text-primary' },
  { id: 'dontKnow', label: "I don't know it", icon: QuestionMarkCircleIcon, iconClass: 'text-gray-500' },
];

const VOTE_LABEL = {
  love: 'love it',
  know: 'know it',
  dontKnow: "don't know it",
  unsure: 'not sure',
  unanswered: 'not voted yet',
};

// How the count looks for each of your votes
const STYLES = {
  love: 'bg-rose-100 text-rose-600 hover:bg-rose-200/70',
  know: 'text-primary ring-2 ring-inset ring-primary/70 hover:bg-primary/5',
  dontKnow: 'text-gray-500 hover:bg-gray-100',
  unsure: 'text-gray-500 hover:bg-gray-100',
  unanswered: 'text-primary ring-2 ring-inset ring-primary/70 hover:bg-primary/5',
};

function VoteMark({ vote, played }) {
  const iconClass = 'h-3.5 w-3.5 md:h-4 md:w-4';
  if (vote === 'love') return <HeartIcon aria-hidden className={cn(iconClass, 'text-rose-500')} />;
  if (vote === 'know') return <CheckIcon aria-hidden className={iconClass} />;
  if (vote === 'dontKnow') return <QuestionMarkCircleIcon aria-hidden className={iconClass} />;
  if (vote === 'unsure') return <EllipsisHorizontalIcon aria-hidden className={iconClass} />;
  if (played) return null;
  return <span aria-hidden className="text-[10px] font-semibold uppercase leading-none tracking-wide md:text-[11px]">Vote</span>;
}

// The song's love count, styled by your own vote. Tapping it opens a small
// menu to change your vote in place.
export default function SongVotingButton({ jamSong, vote, onVote, onKnow, onChange }) {
  const [open, setOpen] = useState(false);
  const { played } = jamSong;
  const shown = vote || 'unanswered';
  const count = jamSong.votes || 0;
  const label = `${count} love it. Your vote: ${VOTE_LABEL[shown]}.`;

  const box = cn(
    'flex h-12 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg md:h-14 md:w-12',
    // Wait for this device's vote to load so the first render matches the server
    !vote && 'invisible'
  );
  const number = <span className="text-base font-bold tabular-nums leading-none md:text-lg">{count}</span>;

  // Played songs can't be voted on any more, so show the count without a menu
  if (played) {
    return (
      <div className={cn(box, shown === 'love' ? 'bg-rose-50 text-rose-600' : 'text-gray-500')} aria-label={label} role="img">
        {number}
        <VoteMark vote={shown} played />
      </div>
    );
  }

  const pick = (next) => {
    setOpen(false);
    if (next === shown) return;
    changeVote(jamSong._id, next, { onVote, onKnow });
    onChange?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label} Change vote`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            box,
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            STYLES[shown]
          )}
        >
          {number}
          <VoteMark vote={shown} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-60 p-1.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="px-2 pb-1.5 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your vote</p>
          <p className="truncate text-sm font-medium">{jamSong.song?.title}</p>
        </div>
        <div role="menu" aria-label="Your vote">
          {OPTIONS.map(({ id, label: text, icon: Icon, iconClass }) => (
            <VoteOption key={id} selected={shown === id} onSelect={() => pick(id)}>
              <Icon aria-hidden className={cn('h-5 w-5', iconClass)} />
              <span className="flex-1">{text}</span>
            </VoteOption>
          ))}
          <VoteOption small selected={shown === 'unsure'} onSelect={() => pick('unsure')}>
            <EllipsisHorizontalIcon aria-hidden className="h-4 w-4 text-gray-400" />
            <span className="flex-1">Not sure</span>
          </VoteOption>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function VoteOption({ selected, small, onSelect, children }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
        small ? 'mt-0.5 py-1.5 text-xs text-muted-foreground' : 'py-2 text-sm font-medium',
        selected && 'bg-primary/5'
      )}
    >
      {children}
      <CheckIcon aria-hidden className={cn('h-4 w-4 text-primary', !selected && 'invisible')} />
    </button>
  );
}
