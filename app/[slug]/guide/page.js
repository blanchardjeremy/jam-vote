'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  HeartIcon,
  AcademicCapIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
  ListBulletIcon,
  CheckCircleIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { Piano } from 'lucide-react';
import { useJamPage } from '@/lib/hooks/useJamPage';
import { useJamPusher } from '@/lib/hooks/useJamPusher';
import { storage, keys, buildQueue } from '@/lib/utils/guideQueue';
import { alsoMarkKnownForLove } from '@/lib/services/jamSongs';
import { apiRequest } from '@/lib/services/apiHelpers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
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

// The card stack. Behind cards sit lower and smaller, scaled from their bottom
// edge so that edge peeks out under the top card.
const BEHIND = [
  'translateY(10px) scale(0.95)',
  'translateY(20px) scale(0.9)',
];
// Which way each answer sends the card. Swiping that way gives the answer too
// (captaining is buttons only).
const FLY_DIRECTION = { love: 'up', know: 'right', dontKnow: 'left', captain: 'right' };
const SWIPE_ANSWER = { up: 'love', right: 'know', left: 'dontKnow' };
// How far (px) a card has to be dragged before letting go answers
const SWIPE_DISTANCE = 100;
// Off-screen transforms for each direction, for the top card's return on undo
const OFFSCREEN = {
  up: 'translateY(-110%)',
  right: 'translateX(110%) rotate(8deg)',
  left: 'translateX(-110%) rotate(-8deg)',
};

// A short buzz where the browser supports it (Android; iOS Safari doesn't)
const buzz = (ms) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Some browsers throw when vibration isn't allowed; it's only a nicety
  }
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // null for every song, or 'banger' / 'ballad' to limit the picker to one type
  const [typeFilter, setTypeFilter] = useState(null);

  const [queue, setQueue] = useState(null); // jamSong ids, fixed when built
  const [position, setPosition] = useState(0);
  const [history, setHistory] = useState([]); // [{ jamSongId, answer, captainName }]
  const [pendingCaptainType, setPendingCaptainType] = useState(null);
  // Each answer bumps `key` so the progress bar's animations replay
  const [feedback, setFeedback] = useState({ key: 0, answer: null, milestone: null });
  // Highest milestone already celebrated this run, so undo/redo or a shrinking
  // total never repeats one and a skipped one still shows on the next answer
  const [celebratedAt, setCelebratedAt] = useState(0);
  // How the top card should arrive: rising from behind after an answer, or
  // sliding back in from the side it left on undo. `key` replays it.
  const [motion, setMotion] = useState({ key: 0, type: 'initial' });
  // A copy of the card that was just on top, animating away over (an answer)
  // or under (an undo) the new top card. It never takes taps.
  const [outgoing, setOutgoing] = useState(null);
  const topCardRef = useRef(null);
  // Where a swiped card was let go, so its copy flies on from there
  const swipeFromRef = useRef(null);

  const resetMotion = () => {
    setMotion((prev) => ({ key: prev.key + 1, type: 'initial' }));
    setOutgoing(null);
  };

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
    resetMotion();
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
  // How many cards show behind the top one (at most two)
  const behindCount = queue && currentSong
    ? Math.min(BEHIND.length, queue.slice(currentIndex + 1).filter(isAvailable).length)
    : 0;

  // Start loading the next songs' album art so it's there when their card is
  const upcomingArt = queue
    ? queue.slice(currentIndex + 1).filter(isAvailable).slice(0, PRELOAD_ART)
        .map((id) => songsById[id]?.song?.artworkUrl).filter(Boolean).join(' ')
    : '';
  useEffect(() => {
    upcomingArt.split(' ').filter(Boolean).forEach((url) => {
      new Image().src = url;
    });
  }, [upcomingArt]);

  // Animate the new top card in (on load too). It stays mounted from song
  // to song (so a focused button keeps focus), which is why this uses the Web
  // Animations API rather than a CSS class that would need a remount to replay.
  useLayoutEffect(() => {
    const el = topCardRef.current;
    if (!el?.animate) return;
    let from;
    if (prefersReducedMotion()) from = { opacity: 0 };
    else if (motion.type === 'return') from = { transform: OFFSCREEN[motion.dir], opacity: 0 };
    else if (motion.type === 'advance') from = { transform: BEHIND[0] };
    else from = { transform: 'translateY(12px)', opacity: 0 };
    const animation = el.animate([from, { transform: 'none', opacity: 1 }], {
      duration: prefersReducedMotion() ? 150 : motion.type === 'return' ? 280 : 240,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    });
    return () => animation.cancel();
  }, [motion]);

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
    setOutgoing({
      key: motion.key + 1,
      song: currentSong,
      kind: 'fly',
      dir: FLY_DIRECTION[entry.answer],
      answer: entry.answer,
      from: swipeFromRef.current,
    });
    swipeFromRef.current = null;
    setMotion({ key: motion.key + 1, type: 'advance' });
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
    // The card on top settles back into the stack as this one returns
    setOutgoing(currentSong ? { key: motion.key + 1, song: currentSong, kind: 'sink' } : null);
    setMotion({ key: motion.key + 1, type: 'return', dir: FLY_DIRECTION[last.answer] });
  };

  const restart = () => {
    setQueue(buildQueue(jam.songs, typeFilter));
    setPosition(0);
    setHistory([]);
    setCelebratedAt(0);
    resetMotion();
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

      {/* Jam name, with Exit in the top right corner */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-sm font-medium text-gray-500">{jam.name}</h1>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 shrink-0 gap-1 rounded-full pl-2.5 pr-3.5 text-gray-700"
        >
          <Link href={`/${jam.slug}`}>
            <XMarkIcon className="h-4 w-4" />
            Exit
          </Link>
        </Button>
      </div>

      {/* Undo on the left, then progress. Undo keeps its space when there's
          nothing to undo so the bar doesn't jump. */}
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={goBack}
          disabled={history.length === 0}
          aria-label="Undo last answer"
          className={cn(
            'h-9 w-9 shrink-0 rounded-full text-gray-600',
            history.length === 0 && 'invisible'
          )}
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </Button>

        {/* Nothing to show when there was nothing to answer */}
        {total > 0 ? (
          <ProgressBar
            done={history.length}
            total={total}
            progress={currentSong ? progress : 1}
            feedback={feedback}
          />
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <ToggleGroup.Root
        type="single"
        value={typeFilter ?? 'all'}
        // Tapping the selected option again would clear it; keep it selected
        onValueChange={(value) => value && setTypeFilter(value === 'all' ? null : value)}
        aria-label="Which songs to show"
        className="mx-auto mb-4 flex w-fit rounded-full bg-gray-200/70 p-0.5"
      >
        {[
          { value: 'all', label: 'All' },
          { value: 'banger', label: 'Bangers' },
          { value: 'ballad', label: 'Ballads' },
        ].map(({ value, label }) => (
          <ToggleGroup.Item
            key={value}
            value={value}
            className="rounded-full px-3.5 py-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
          >
            {label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      {/* The stack: cards waiting behind, then the top card, with the card
          that just left drawn over it (or under it, on undo) as it animates
          away. Bottom margin leaves room for the cards peeking out below. */}
      <div className="relative isolate mb-6">
        {BEHIND.slice(0, behindCount).map((transform, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute inset-0 origin-bottom rounded-xl border border-gray-200 bg-white shadow-sm"
            style={{ transform, zIndex: -i, opacity: i === 0 ? 1 : 0.7 }}
          />
        ))}

        {outgoing?.kind === 'sink' && (
          <OutgoingCard outgoing={outgoing} onDone={() => setOutgoing(null)} />
        )}

        {currentSong ? (
          <SongCard
            ref={topCardRef}
            song={currentSong}
            onAnswer={answer}
            onSwipe={(dir, from) => {
              swipeFromRef.current = from;
              answer(SWIPE_ANSWER[dir]);
            }}
          />
        ) : (
          <div
            ref={topCardRef}
            className="relative origin-bottom rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
          >
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

        {outgoing?.kind === 'fly' && (
          <OutgoingCard outgoing={outgoing} onDone={() => setOutgoing(null)} />
        )}
      </div>

      {currentSong && history.length === 0 && (
        <p className="-mt-2 mb-4 text-center text-sm text-gray-500">
          Or swipe the card: right if you know it, up if you love it, left if you&apos;re not sure.
        </p>
      )}

      {/* A second way out, for anyone who misses Exit at the top. The
          caught-up card already has its own. */}
      {currentSong && (
        <div className="text-center">
          <Button variant="link" asChild className="text-gray-600">
            <Link href={`/${jam.slug}`}>
              <ListBulletIcon className="h-4 w-4" />
              Back to the song list
            </Link>
          </Button>
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

// Stamps that fade in as a card is dragged toward an answer. Each one's
// opacity comes from a CSS variable set while dragging (0 to 1).
const STAMPS = [
  { dir: 'right', answer: 'know', position: 'left-4 top-4 -rotate-12', tint: 'bg-primary/10', className: 'text-primary border-primary bg-white' },
  { dir: 'left', answer: 'dontKnow', position: 'right-4 top-4 rotate-12', tint: 'bg-gray-500/10', className: 'text-gray-600 border-gray-500 bg-white' },
  { dir: 'up', answer: 'love', position: 'inset-x-0 top-4 mx-auto w-fit', tint: 'bg-rose-500/10', className: 'text-rose-600 border-rose-500 bg-white' },
].map((stamp) => ({ ...stamp, ...MAIN_ANSWERS.find((a) => a.id === stamp.answer) }));

const SWIPE_VARS = ['--swipe-right', '--swipe-left', '--swipe-up'];

// Which way a drag points, and how far along it is (1 = far enough to answer)
function swipeOf(dx, dy) {
  if (-dy > Math.abs(dx)) return { dir: 'up', amount: -dy / SWIPE_DISTANCE };
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { dir: dx > 0 ? 'right' : 'left', amount: Math.abs(dx) / SWIPE_DISTANCE };
  }
  return { dir: null, amount: 0 };
}

// Drag-to-answer for the top card, like a dating app: the card follows the
// pointer, the stamp for that direction fades in, and letting go past
// SWIPE_DISTANCE (or flicking) answers. Updates go straight to the element's
// style so a drag never re-renders the page.
function useSwipe(onSwipe) {
  const drag = useRef(null);
  const justDragged = useRef(false);

  if (!onSwipe) return {};

  const setVars = (el, dir, amount) => {
    SWIPE_VARS.forEach((v) => el.style.setProperty(v, v === `--swipe-${dir}` ? Math.min(1, amount) : 0));
  };
  const reset = (el, animate) => {
    el.style.transition = animate ? 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)' : '';
    el.style.transform = '';
    SWIPE_VARS.forEach((v) => el.style.removeProperty(v));
  };

  return {
    onPointerDown: (e) => {
      if (e.button !== 0 || drag.current) return;
      // In case the last drag ended without a click to swallow
      justDragged.current = false;
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, vx: 0, vy: 0, t: e.timeStamp, active: false, ready: null };
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const el = e.currentTarget;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.active) {
        // A small wobble is still a tap
        if (Math.hypot(dx, dy) < 8) return;
        d.active = true;
        try {
          // Keep getting moves when the pointer leaves the card
          el.setPointerCapture(e.pointerId);
        } catch {
          // The pointer is already gone; the drag still works while over the card
        }
        el.style.transition = 'none';
      }
      const dt = Math.max(1, e.timeStamp - d.t);
      d.vx = (dx - d.dx) / dt;
      d.vy = (dy - d.dy) / dt;
      Object.assign(d, { dx, dy, t: e.timeStamp });
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`;
      const { dir, amount } = swipeOf(dx, dy);
      setVars(el, dir, amount);
      // A tick when the card is far enough to answer on release
      const ready = amount >= 1 ? dir : null;
      if (ready && ready !== d.ready) buzz(8);
      d.ready = ready;
    },
    onPointerUp: (e) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null;
      if (!d.active) return;
      justDragged.current = true;
      const el = e.currentTarget;
      const { dir, amount } = swipeOf(d.dx, d.dy);
      // A quick flick counts even if it's short of the full distance
      const speed = dir === 'up' ? -d.vy : dir === 'right' ? d.vx : -d.vx;
      if (dir && (amount >= 1 || (amount >= 0.35 && speed > 0.5))) {
        const from = el.style.transform;
        reset(el, false);
        buzz(12);
        onSwipe(dir, from);
      } else {
        reset(el, true);
      }
    },
    onPointerCancel: (e) => {
      if (drag.current?.id !== e.pointerId) return;
      drag.current = null;
      reset(e.currentTarget, true);
    },
    // The click that ends a drag shouldn't also press the button under it
    onClickCapture: (e) => {
      if (!justDragged.current) return;
      justDragged.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

// How many songs ahead to load album art for
const PRELOAD_ART = 3;

// One song's card: album art, title, artist, captains and the answer buttons. With
// `onSwipe` it can be dragged to answer. Without `onAnswer` it's a look-alike
// copy whose buttons can't be used.
function SongCard({ ref, song, onAnswer, onSwipe, className, ...props }) {
  const interactive = !!onAnswer;
  const swipe = useSwipe(onSwipe);
  return (
    <div
      ref={ref}
      className={cn(
        'relative origin-bottom select-none overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
        onSwipe && 'cursor-grab active:cursor-grabbing',
        className
      )}
      {...swipe}
      {...props}
    >
      {/* A minimum height that fits a two-line title, and smaller type for
          longer titles, so the buttons stay put from song to song. Only an
          unusually long title or large text settings make it grow. The title
          area takes drags in every direction; the button area leaves vertical
          drags to page scrolling. */}
      <div className="relative flex min-h-40 touch-none flex-col items-center justify-center px-5 py-4 text-center">
        <AlbumArt url={song.song.artworkUrl} />
        <h2
          className={cn(
            'font-bold leading-tight text-gray-900 [overflow-wrap:anywhere]',
            titleSize(song.song.title)
          )}
        >
          {song.song.title}
        </h2>
        <p className="mt-1 line-clamp-1 text-lg text-muted-foreground font-medium">
          {song.song.artist}
        </p>
        {song.captains?.length > 0 && (
          <p className="mt-1.5 inline-flex max-w-full items-center gap-1 text-sm text-gray-500">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Captained by {song.captains.map((c) => c.name).join(', ')}
            </span>
          </p>
        )}
      </div>

      <div className="touch-pan-y border-t border-gray-100 p-4">
        <div className="flex flex-col gap-3">
          {MAIN_ANSWERS.map(({ id, label, icon: Icon, className }) => (
            <button
              key={id}
              onClick={interactive ? () => onAnswer(id) : undefined}
              tabIndex={interactive ? undefined : -1}
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
              onClick={interactive ? () => onAnswer(id, captainType) : undefined}
              tabIndex={interactive ? undefined : -1}
              className="flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 active:scale-[0.98]"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* What letting go will do: a tint over the card and a stamp */}
      {STAMPS.map(({ dir, label, icon: Icon, position, tint, className }) => (
        <div
          key={dir}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ opacity: `var(--swipe-${dir}, 0)` }}
        >
          <div className={cn('absolute inset-0', tint)} />
          <div
            className={cn(
              'absolute flex items-center gap-1.5 rounded-lg border-[3px] px-3 py-1.5 text-xl font-extrabold uppercase tracking-wide shadow-md',
              position,
              className
            )}
          >
            <Icon className="h-6 w-6" />
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// The card that just left the top of the stack: it flies off after an answer
// (showing that answer's stamp, and carrying on from where a swipe let go),
// or settles back behind the returning card on undo. Taps pass straight
// through it to the new top card.
function OutgoingCard({ outgoing, onDone }) {
  const animation = outgoing.kind === 'sink' ? 'guide-card-sink' : `guide-fly-${outgoing.dir}`;
  const stamp = STAMPS.find((s) => s.answer === outgoing.answer);
  return (
    <SongCard
      key={outgoing.key}
      song={outgoing.song}
      aria-hidden
      inert
      className={cn(
        'pointer-events-none !absolute inset-x-0 top-0',
        outgoing.kind === 'sink' ? 'z-0' : 'z-10',
        animation
      )}
      style={{
        transform: outgoing.from || undefined,
        ...(stamp && { [`--swipe-${stamp.dir}`]: 1 }),
      }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) onDone();
      }}
    />
  );
}

// The song's album cover, or a note on a plain square when it has none (or
// it fails to load), so the title and buttons sit in the same place either
// way. Keyed by URL so the last song's cover never shows while the next loads.
function AlbumArt({ url }) {
  const [failed, setFailed] = useState(null);
  const showArt = url && failed !== url;
  return (
    <div className="mb-3 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 shadow-sm ring-1 ring-black/5">
      {showArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt=""
          draggable={false}
          onError={() => setFailed(url)}
          className="h-full w-full object-cover"
        />
      ) : (
        <MusicalNoteIcon aria-hidden className="h-10 w-10 text-gray-300" />
      )}
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

// Progress through this run, sized to sit between the undo and close
// buttons. On each answer the bar grows, a glint sweeps across it, the count
// pops and a "+1" floats up; crossing a quarter mark adds a short message
// above the bar and a confetti burst.
function ProgressBar({ done, total, progress, feedback }) {
  const pct = Math.round(progress * 100);
  const animate = feedback.key > 0;

  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-2.5">
      {feedback.milestone && (
        // Centered by the wrapper, since the chip's own transform is animated
        <span className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex justify-center">
          <span
            key={`m-${feedback.key}`}
            className="guide-milestone rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
          >
            {feedback.milestone}
          </span>
        </span>
      )}

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Songs answered"
        className="relative h-2.5 flex-1 rounded-full bg-gray-200"
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

      <span
        key={`c-${feedback.key}`}
        className={cn(
          'shrink-0 text-sm font-medium tabular-nums text-gray-700',
          animate && 'guide-pop inline-block'
        )}
      >
        {done}/{total}
      </span>
    </div>
  );
}
