'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  HeartIcon,
  AcademicCapIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Piano } from 'lucide-react';
import { useJamPage } from '@/lib/hooks/useJamPage';
import { useJamPusher } from '@/lib/hooks/useJamPusher';
import { storage, keys, buildQueue } from '@/lib/utils/guideQueue';
import { alsoMarkKnownForLove } from '@/lib/services/jamSongs';
import { apiRequest } from '@/lib/services/apiHelpers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CaptainNameModal from '@/components/CaptainNameModal';
import LoadingBlock from '@/components/LoadingBlock';
import PageTitle from '@/components/ui/page-title';
import { cn } from '@/lib/utils';

// Index of the first song at or after `from` that is still available
function firstAvailableIndex(queue, from, isAvailable) {
  const offset = queue.slice(from).findIndex(isAvailable);
  return offset === -1 ? queue.length : from + offset;
}

// Main answers come first; the captain options sit below as smaller buttons.
// Lucide's piano, drawn at Heroicons' outline stroke width so it matches the others
const PianoIcon = (props) => <Piano strokeWidth={1.5} {...props} />;

const MAIN_ANSWERS = [
  { id: 'love', label: 'I love it', icon: HeartIcon, className: 'text-rose-600 border-rose-200 bg-rose-50/40 hover:bg-rose-50' },
  { id: 'know', label: 'I know it', icon: AcademicCapIcon, className: 'text-primary border-primary/30 bg-primary/[0.03] hover:bg-primary/5' },
  { id: 'dontKnow', label: "I'm not sure", icon: QuestionMarkCircleIcon, className: 'text-gray-600 border-gray-200 hover:bg-gray-50' },
];
const CAPTAIN_ANSWERS = [
  { id: 'captain', captainType: 'regular', label: "I'll captain it", icon: UserIcon },
  { id: 'captain', captainType: 'piano', label: "I'll play piano", icon: PianoIcon },
];

// Color of the little "+1" that floats off the progress bar, per answer
const ANSWER_ACCENT = {
  love: 'text-rose-500',
  know: 'text-primary',
  dontKnow: 'text-gray-500',
  captain: 'text-indigo-600',
};

const MILESTONES = [
  { at: 0.25, text: 'Nice start!' },
  { at: 0.5, text: 'Halfway there!' },
  { at: 0.75, text: 'Almost done!' },
];

const CONFETTI_COLORS = ['bg-rose-400', 'bg-indigo-500', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400'];
// Fixed spread so each burst looks the same and renders the same on server and client
const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 26 + (i % 3) * 10;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist * 0.8)}px`,
    rot: `${(i * 67) % 360}deg`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: i % 2 === 0,
  };
});

// Fire a save in the background. The picker never waits for it, and a
// failed save is simply dropped (the shared handlers already log/toast).
const inBackground = (promise) => {
  Promise.resolve(promise).catch(() => {});
};

export default function GuidedPickerPage() {
  const params = useParams();
  const {
    jam,
    setJam,
    error,
    isLoading,
    sortMethod,
    handleVote,
    handleKnow,
    clearHighlightAfterDelay,
  } = useJamPage(params.slug);

  useJamPusher({ jam, setJam, sortMethod, clearHighlightAfterDelay });

  // Both types are included by default; unchecking one limits the picker to the other
  const [includeTypes, setIncludeTypes] = useState({ banger: true, ballad: true });
  const typeFilter = includeTypes.banger && includeTypes.ballad
    ? null
    : includeTypes.banger ? 'banger' : 'ballad';

  const toggleType = (type, checked) => {
    setIncludeTypes((prev) => {
      const next = { ...prev, [type]: checked };
      // Keep at least one type selected
      return next.banger || next.ballad ? next : prev;
    });
  };

  const [queue, setQueue] = useState(null); // jamSong ids, fixed when built
  const [position, setPosition] = useState(0);
  const [history, setHistory] = useState([]); // [{ jamSongId, answer, captainName }]
  const [pendingCaptainType, setPendingCaptainType] = useState(null);
  // Each answer bumps `key` so the progress bar's animations replay
  const [feedback, setFeedback] = useState({ key: 0, answer: null, milestone: null });
  // Highest milestone already celebrated this run, so undo/redo or a shrinking
  // total never repeats one and a skipped one still shows on the next answer
  const [celebratedAt, setCelebratedAt] = useState(0);

  // Build the queue once the jam has loaded, and again when the type filter changes
  const jamLoaded = !!jam;
  useEffect(() => {
    if (!jamLoaded) return;
    // A "Vote" badge in the list links here with ?song=<id> to start on that song
    const startId = new URLSearchParams(window.location.search).get('song');
    const queue = buildQueue(jam.songs, typeFilter);
    const startSong = startId && jam.songs.find((s) => s._id === startId && !s.played);
    setQueue(startSong ? [startId, ...queue.filter((id) => id !== startId)] : queue);
    setPosition(0);
    setHistory([]);
    setCelebratedAt(0);
    // Only rebuild on load / filter change, not on every live vote
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jamLoaded, typeFilter]);

  const songsById = useMemo(
    () => Object.fromEntries((jam?.songs || []).map((s) => [s._id, s])),
    [jam]
  );

  // Skip songs that were removed or played since the queue was built
  const isAvailable = useCallback(
    (id) => songsById[id] && !songsById[id].played,
    [songsById]
  );

  const currentIndex = queue ? firstAvailableIndex(queue, position, isAvailable) : 0;
  const currentSong = queue && currentIndex < queue.length ? songsById[queue[currentIndex]] : null;

  // apiRequest throws on an error response (plain fetch doesn't), so a failed
  // captain change is reported instead of silently dropped.
  const songTitle = (jamSongId) => songsById[jamSongId]?.song?.title || 'this song';

  const signUpAsCaptain = (jamSongId, type, name) =>
    apiRequest(`/api/jams/${jam._id}/captain`, {
      method: 'POST',
      body: JSON.stringify({ name, type, songId: jamSongId }),
    }).catch((e) => {
      toast.error(`Couldn't sign you up to captain "${songTitle(jamSongId)}": ${e.message}`);
    });

  const removeCaptain = (jamSongId, name) =>
    apiRequest(
      `/api/jams/${jam._id}/captain?songId=${jamSongId}&name=${encodeURIComponent(name)}`,
      { method: 'DELETE' }
    ).catch((e) => {
      toast.error(`Couldn't remove you as captain of "${songTitle(jamSongId)}": ${e.message}`);
    });

  const markKnown = (jamSongId) => {
    storage.set(keys.know(jamSongId), 'true');
    inBackground(handleKnow(jamSongId, 'know'));
  };

  // Progress through this run: answered so far vs. answered + still to go
  const remaining = queue
    ? queue.slice(currentIndex).filter(isAvailable).length
    : 0;
  const total = history.length + remaining;
  const progress = total > 0 ? history.length / total : 0;

  const advance = (entry) => {
    const after = total > 0 ? (history.length + 1) / total : 1;
    // The last answer gets the "all caught up" celebration instead
    const reached = after < 1
      ? MILESTONES.filter((m) => m.at > celebratedAt && after >= m.at).pop()
      : null;
    if (reached) setCelebratedAt(reached.at);
    setFeedback((prev) => ({
      key: prev.key + 1,
      answer: entry.answer,
      milestone: reached ? reached.text : null,
    }));
    setHistory((prev) => [...prev, entry]);
    setPosition(currentIndex + 1);
  };

  const captain = (jamSongId, type, name) => {
    signUpAsCaptain(jamSongId, type, name);
    markKnown(jamSongId);
    advance({ jamSongId, answer: 'captain', captainName: name });
  };

  // Every answer is saved on this device right away and sent to the server
  // in the background, so the next song appears instantly.
  const answer = (answerId, captainType) => {
    if (!currentSong) return;
    const id = currentSong._id;

    if (answerId === 'love') {
      storage.set(keys.love(id), 'true');
      inBackground(handleVote(id, 'vote'));
      // A heart also counts as a know (once per person)
      const addedKnow = alsoMarkKnownForLove(id, (songId) => handleKnow(songId, 'know'));
      advance({ jamSongId: id, answer: 'love', addedKnow });
    } else if (answerId === 'know') {
      markKnown(id);
      advance({ jamSongId: id, answer: 'know' });
    } else if (answerId === 'dontKnow') {
      storage.set(keys.dontKnow(id), 'true');
      inBackground(handleKnow(id, 'dontknow'));
      advance({ jamSongId: id, answer: 'dontKnow' });
    } else if (answerId === 'captain') {
      const name = storage.get('userFirstName');
      if (!name) {
        // First time only: ask for a first name, then finish in handleNameSubmit
        setPendingCaptainType(captainType);
        return;
      }
      captain(id, captainType, name);
    }
  };

  const handleNameSubmit = (name) => {
    const type = pendingCaptainType;
    setPendingCaptainType(null);
    if (!currentSong || !type) return;
    captain(currentSong._id, type, name);
  };

  // Undo the last answer and show that song again
  const goBack = () => {
    const last = history[history.length - 1];
    if (!last) return;
    const id = last.jamSongId;
    if (last.answer === 'love') {
      storage.remove(keys.love(id));
      inBackground(handleVote(id, 'unvote'));
      // Undo also takes back a know that this heart added
      if (last.addedKnow) {
        storage.remove(keys.know(id));
        inBackground(handleKnow(id, 'unknow'));
      }
    } else if (last.answer === 'know' || last.answer === 'captain') {
      storage.remove(keys.know(id));
      inBackground(handleKnow(id, 'unknow'));
      if (last.answer === 'captain') inBackground(removeCaptain(id, last.captainName));
    } else if (last.answer === 'dontKnow') {
      storage.remove(keys.dontKnow(id));
      inBackground(handleKnow(id, 'undontknow'));
    }
    setHistory((prev) => prev.slice(0, -1));
    setPosition(queue.indexOf(id));
  };

  const restart = () => {
    setQueue(buildQueue(jam.songs, typeFilter));
    setPosition(0);
    setHistory([]);
    setCelebratedAt(0);
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6">
        <h3 className="text-sm font-medium text-red-800">Error loading jam</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading || !jam || !queue) {
    return <LoadingBlock />;
  }

  const newSongsAvailable = !currentSong ? buildQueue(jam.songs, typeFilter).length : 0;

  return (
    <div className="max-w-xl mx-auto">
      <PageTitle title={`${jam.name} – Guided voting`} />

      <div className="mb-1 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-gray-600">
          <Link href={`/${jam.slug}`}>
            <ArrowLeftIcon className="h-4 w-4" />
            Back to list
          </Link>
        </Button>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={goBack} className="text-gray-600">
            <ArrowUturnLeftIcon className="h-4 w-4" />
            Undo last
          </Button>
        )}
      </div>

      {/* Nothing to show when there was nothing to answer */}
      {total > 0 && (
        <ProgressBar
          done={history.length}
          total={total}
          progress={currentSong ? progress : 1}
          feedback={feedback}
        />
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-2">{jam.name}</h1>

      <div className="mb-3 flex flex-wrap items-center gap-5">
        {[
          { type: 'banger', label: 'Bangers' },
          { type: 'ballad', label: 'Ballads' },
        ].map(({ type, label }) => (
          <label key={type} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <Checkbox
              checked={includeTypes[type]}
              onCheckedChange={(checked) => toggleType(type, checked === true)}
            />
            {label}
          </label>
        ))}
      </div>

      {currentSong ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* A minimum height that fits a two-line title, and smaller type for
              longer titles, so the buttons stay put from song to song. Only an
              unusually long title or large text settings make it grow. */}
          <div
            key={currentSong._id}
            className="guide-card-in flex min-h-40 flex-col items-center justify-center px-5 py-4 text-center"
          >
            <h2
              className={cn(
                'font-bold leading-tight text-gray-900 [overflow-wrap:anywhere]',
                titleSize(currentSong.song.title)
              )}
            >
              {currentSong.song.title}
            </h2>
            <p className="mt-1 line-clamp-1 text-lg text-muted-foreground font-medium">
              {currentSong.song.artist}
            </p>
            {currentSong.captains?.length > 0 && (
              <p className="mt-1.5 inline-flex max-w-full items-center gap-1 text-sm text-gray-500">
                <UserIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  Captained by {currentSong.captains.map((c) => c.name).join(', ')}
                </span>
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="flex flex-col gap-3">
              {MAIN_ANSWERS.map(({ id, label, icon: Icon, className }) => (
                <button
                  key={id}
                  onClick={() => answer(id)}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg border-2 px-3 py-4 text-base font-semibold transition-colors active:scale-[0.98]',
                    className
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {label}
                </button>
              ))}
            </div>


            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-dashed border-gray-200 pt-4">
              {CAPTAIN_ANSWERS.map(({ id, captainType, label, icon: Icon }) => (
                <button
                  key={captainType}
                  onClick={() => answer(id, captainType)}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 active:scale-[0.98]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="guide-card-in rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="relative mx-auto h-12 w-12">
            <CheckCircleIcon className="guide-pop h-12 w-12 text-green-600" />
            {history.length > 0 && <Confetti />}
          </div>
          <h2 className="mt-3 text-xl font-bold text-gray-900">You&apos;re all caught up!</h2>
          <p className="mt-1 text-gray-600">
            {history.length > 0
              ? `You answered ${history.length} ${history.length === 1 ? 'song' : 'songs'}.`
              : 'There are no songs left for you to answer.'}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            {newSongsAvailable > 0 && (
              <Button onClick={restart}>
                Keep going ({newSongsAvailable} new)
              </Button>
            )}
            <Button variant={newSongsAvailable > 0 ? 'outline' : 'default'} asChild>
              <Link href={`/${jam.slug}`}>Back to the song list</Link>
            </Button>
          </div>
        </div>
      )}

      <CaptainNameModal
        isOpen={!!pendingCaptainType}
        onClose={() => setPendingCaptainType(null)}
        onSubmit={handleNameSubmit}
      />
    </div>
  );
}

// Longer titles get smaller type so most fit in two lines
function titleSize(title) {
  if (title.length > 55) return 'text-lg';
  if (title.length > 30) return 'text-xl';
  return 'text-2xl';
}

// A burst of confetti centered on its (relative) parent
function Confetti() {
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={cn(
            'guide-confetti absolute left-0 top-0 h-1.5 w-1.5',
            c.round ? 'rounded-full' : 'rounded-[1px]',
            c.color
          )}
          style={{ '--dx': c.dx, '--dy': c.dy, '--rot': c.rot }}
        />
      ))}
    </span>
  );
}

// Progress through this run. On each answer the bar grows, a glint sweeps
// across it, the count pops and a "+1" floats up; crossing a quarter mark
// adds a short message and a confetti burst.
function ProgressBar({ done, total, progress, feedback }) {
  const pct = Math.round(progress * 100);
  const animate = feedback.key > 0;

  return (
    <div className="mb-4">
      <div className="relative mb-1.5 flex h-5 items-center justify-between text-xs font-medium text-gray-500">
        <span>Your progress</span>
        {feedback.milestone && (
          // Centered by the wrapper, since the chip's own transform is animated
          <span className="pointer-events-none absolute inset-x-0 flex justify-center">
            <span
              key={`m-${feedback.key}`}
              className="guide-milestone rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
            >
              {feedback.milestone}
            </span>
          </span>
        )}
        <span
          key={`c-${feedback.key}`}
          className={cn('tabular-nums text-gray-700', animate && 'guide-pop inline-block')}
        >
          {done} / {total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Songs answered"
        className="relative h-2.5 rounded-full bg-gray-200"
      >
        <div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-primary to-rose-500 transition-[width] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ width: `${pct}%` }}
        >
          {animate && (
            <span
              key={`g-${feedback.key}`}
              className="guide-glint absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            />
          )}
        </div>

        {/* Leading edge of the bar: where the +1 and confetti come from. It
            moves with the same timing as the fill, so they ride the bar's end. */}
        {animate && (
          <span
            className="pointer-events-none absolute top-1/2 transition-[left] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ left: `${pct}%` }}
          >
            <span key={`e-${feedback.key}`}>
              <span
                className={cn(
                  'guide-float-up absolute bottom-1 left-0 text-xs font-bold',
                  ANSWER_ACCENT[feedback.answer]
                )}
              >
                {feedback.answer === 'love' ? <HeartIcon className="h-4 w-4 fill-current" /> : '+1'}
              </span>
              {feedback.milestone && <Confetti />}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
