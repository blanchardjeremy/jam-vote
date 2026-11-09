import { useState } from 'react';
import { HeartIcon, CheckIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// The counts behind a song's know bar. Every heart also counts as a know, so
// `loves` is always a subset of `knows`, even for hearts given before knows
// were tracked. `youKnowIt` makes sure this device is counted at least once.
export function knowCounts(jamSong, youKnowIt = false) {
  const loves = jamSong.votes || 0;
  const knows = Math.max(jamSong.knows || 0, loves, youKnowIt ? 1 : 0);
  const dontKnows = jamSong.dontKnows || 0;
  return { loves, knows, dontKnows, answered: knows + dontKnows };
}

const pct = (part, whole) => (whole > 0 ? `${(part / whole) * 100}%` : '0%');

const YOUR_ANSWER = {
  know: 'You know it',
  dontKnow: "You don't know it",
  unsure: "You're not sure",
  unanswered: "You haven't answered yet",
};

// How well the room knows a song: one small bar whose length is how many
// people answered (scaled to the most-answered song in the jam). From the
// left: loved it (rose), knows it without a heart (indigo), doesn't know it
// (slate), then light grey for everyone who hasn't answered. Hover or tap for
// the numbers.
export default function KnowBar({ jamSong, maxAnswers, status }) {
  const [open, setOpen] = useState(false);
  const youKnowIt = status === 'know';
  const { loves, knows, dontKnows, answered } = knowCounts(jamSong, youKnowIt);
  const scale = Math.max(maxAnswers, answered);
  if (scale === 0) return null;

  const summary = `${loves} love it, ${knows} know it, ${dontKnows} don't know it`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={summary}
          // Hover opens it with a mouse; a tap toggles it on touch screens
          onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
          onClick={(e) => e.stopPropagation()}
          className="-my-1.5 inline-flex items-center rounded py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden className="flex h-1.5 w-20 overflow-hidden rounded-full bg-gray-200/70 sm:h-2 sm:w-36">
            <span className="flex h-full overflow-hidden rounded-full" style={{ width: pct(answered, scale) }}>
              <span className="h-full bg-rose-500" style={{ width: pct(loves, answered) }} />
              <span className="h-full bg-primary" style={{ width: pct(knows - loves, answered) }} />
              <span className="h-full flex-1 bg-slate-400" />
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-auto p-2.5 text-xs"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="space-y-1">
          <li className="flex items-center gap-1.5">
            <HeartIcon aria-hidden className="h-3.5 w-3.5 text-rose-500" />
            <span className="font-semibold tabular-nums">{loves}</span> love it
          </li>
          <li className="flex items-center gap-1.5">
            <CheckIcon aria-hidden className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold tabular-nums">{knows}</span> know it
            {loves > 0 && <span className="text-gray-500">(incl. loves)</span>}
          </li>
          <li className="flex items-center gap-1.5">
            <QuestionMarkCircleIcon aria-hidden className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold tabular-nums">{dontKnows}</span> don&apos;t know it
          </li>
        </ul>
        {status && YOUR_ANSWER[status] && (
          <p className="mt-2 border-t border-gray-100 pt-1.5 text-gray-500">{YOUR_ANSWER[status]}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
