import { useState } from "react";
import { HeartIcon, CheckIcon } from "@heroicons/react/20/solid";
import {
  QuestionMarkCircleIcon,
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
  { id: 'dontKnow', label: "I'm not sure", icon: QuestionMarkCircleIcon, iconClass: 'text-gray-500' },
];

const VOTE_LABEL = {
  love: 'love it',
  know: 'know it',
  dontKnow: 'not sure',
  unanswered: 'not voted yet',
};

// One tap to love a song, one tap to take it back. Taking back a love keeps
// the know that came with it, since you still know the song.
export default function HeartToggle({ jamSong, vote, onVote, onKnow, onChange }) {
  const loved = vote === 'love';
  const label = loved ? 'You love it. Remove love' : 'Love it';
  const box = cn(
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-11 md:w-11',
    // Wait for this device's vote to load so the first render matches the server
    !vote && 'invisible'
  );

  // Played songs can't be voted on any more
  if (jamSong.played) {
    return (
      <div className={cn(box, loved ? 'bg-rose-50 text-rose-400' : 'text-gray-300')} aria-label={loved ? 'You loved it' : undefined} role={loved ? 'img' : undefined}>
        {loved ? <HeartIcon aria-hidden className="h-5 w-5 md:h-6 md:w-6" /> : <HeartOutline aria-hidden className="h-5 w-5 md:h-6 md:w-6" />}
      </div>
    );
  }

  const toggle = (e) => {
    e.stopPropagation();
    changeVote(jamSong._id, loved ? 'know' : 'love', { onVote, onKnow });
    onChange?.();
  };

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={loved}
      onClick={toggle}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        box,
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        loved ? 'bg-rose-100 text-rose-500 hover:bg-rose-200/70' : 'text-gray-400 hover:bg-rose-50 hover:text-rose-500'
      )}
    >
      {loved ? <HeartIcon aria-hidden className="h-6 w-6" /> : <HeartOutline aria-hidden className="h-6 w-6" />}
    </button>
  );
}

function Mark({ vote }) {
  if (vote === 'love' || vote === 'know') return <CheckIcon aria-hidden className="h-4 w-4 text-primary" />;
  if (vote === 'dontKnow') return <QuestionMarkCircleIcon aria-hidden className="h-4 w-4 text-gray-500" />;
  // Not voted yet: an empty ring to tap and answer
  return <span aria-hidden className="h-3 w-3 rounded-full border-[1.5px] border-dashed border-primary/60" />;
}

// A small mark for your vote, shown before the know bar. Tapping it opens a
// menu to give or change your vote in place.
export function VoteMark({ jamSong, vote, onVote, onKnow, onChange }) {
  const [open, setOpen] = useState(false);
  if (!vote) return <span className="h-4 w-4" aria-hidden />;
  const label = `Your vote: ${VOTE_LABEL[vote]}.`;

  // Played songs can't be voted on any more, so the mark has no menu
  if (jamSong.played) {
    if (vote === 'unanswered') return <span className="h-4 w-4" aria-hidden />;
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" role="img" aria-label={label}>
        <Mark vote={vote} />
      </span>
    );
  }

  const pick = (next) => {
    setOpen(false);
    if (next === vote) return;
    changeVote(jamSong._id, next, { onVote, onKnow });
    onChange?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label} ${vote === 'unanswered' ? 'Vote' : 'Change vote'}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          // Bigger tap area than the mark itself
          className="-m-2 inline-flex items-center justify-center rounded-md p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center">
            <Mark vote={vote} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
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
            <VoteOption key={id} selected={vote === id} onSelect={() => pick(id)}>
              <Icon aria-hidden className={cn('h-5 w-5', iconClass)} />
              <span className="flex-1">{text}</span>
            </VoteOption>
          ))}
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
