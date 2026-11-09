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
import { compareByVotes } from '@/lib/utils/songOrder';
import { alsoMarkKnownForLove } from '@/lib/services/jamSongs';
import { apiRequest } from '@/lib/services/apiHelpers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CaptainNameModal from '@/components/CaptainNameModal';
import LoadingBlock from '@/components/LoadingBlock';
import PageTitle from '@/components/ui/page-title';
import { cn } from '@/lib/utils';

// localStorage keys shared with the list view, so answers given in either
// place are remembered in both.
const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

const keys = {
  love: (id) => `vote-${id}`,
  know: (id) => `know-${id}`,
  dontKnow: (id) => `dontknow-${id}`,
};

function isAnsweredOnThisDevice(jamSong) {
  const id = jamSong._id;
  if (storage.get(keys.love(id)) === 'true') return true;
  if (storage.get(keys.know(id)) === 'true') return true;
  if (storage.get(keys.dontKnow(id)) === 'true') return true;
  const name = storage.get('userFirstName');
  return !!name && (jamSong.captains || []).some((c) => c.name === name);
}

// Songs still to go through: unplayed, optionally one type, not answered yet,
// ranked by hearts (then know) at the moment the queue is built.
function buildQueue(songs, typeFilter) {
  return (songs || [])
    .filter((s) => !s.played)
    .filter((s) => !typeFilter || s.song?.type === typeFilter)
    .filter((s) => !isAnsweredOnThisDevice(s))
    .sort(compareByVotes)
    .map((s) => s._id);
}

// Index of the first song at or after `from` that is still available
function firstAvailableIndex(queue, from, isAvailable) {
  const offset = queue.slice(from).findIndex(isAvailable);
  return offset === -1 ? queue.length : from + offset;
}

// Top row: captain options. Bottom row: the quick answers.
// Lucide's piano, drawn at Heroicons' outline stroke width so it matches the others
const PianoIcon = (props) => <Piano strokeWidth={1.5} {...props} />;

const CAPTAIN_ANSWERS = [
  { id: 'captain', captainType: 'regular', label: "I'll captain it", icon: UserIcon, className: 'text-indigo-700 border-indigo-200 hover:bg-indigo-50' },
  { id: 'captain', captainType: 'piano', label: "I'll play piano", icon: PianoIcon, className: 'text-indigo-700 border-indigo-200 hover:bg-indigo-50' },
];
const QUICK_ANSWERS = [
  { id: 'love', label: 'I love it', icon: HeartIcon, className: 'text-rose-600 border-rose-200 hover:bg-rose-50' },
  { id: 'know', label: 'I know it', icon: AcademicCapIcon, className: 'text-primary border-primary/30 hover:bg-primary/5' },
  { id: 'dontKnow', label: "I don't know it", icon: QuestionMarkCircleIcon, className: 'text-gray-600 border-gray-200 hover:bg-gray-50' },
];

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
    groupingEnabled,
    sortMethod,
    handleVote,
    handleKnow,
    clearHighlightAfterDelay,
  } = useJamPage(params.slug);

  useJamPusher({ jam, setJam, sortMethod, groupingEnabled, clearHighlightAfterDelay });

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

  // Build the queue once the jam has loaded, and again when the type filter changes
  const jamLoaded = !!jam;
  useEffect(() => {
    if (!jamLoaded) return;
    setQueue(buildQueue(jam.songs, typeFilter));
    setPosition(0);
    setHistory([]);
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

  const advance = (entry) => {
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
    }
    setHistory((prev) => prev.slice(0, -1));
    setPosition(queue.indexOf(id));
  };

  const restart = () => {
    setQueue(buildQueue(jam.songs, typeFilter));
    setPosition(0);
    setHistory([]);
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
          <div className="px-5 pt-4 pb-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{currentSong.song.title}</h2>
            <p className="text-lg text-muted-foreground font-medium">{currentSong.song.artist}</p>
            {currentSong.captains?.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500">
                <UserIcon className="h-4 w-4" />
                Captained by {currentSong.captains.map((c) => c.name).join(', ')}
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {CAPTAIN_ANSWERS.map(({ id, captainType, label, icon: Icon, className }) => (
                <AnswerButton
                  key={captainType}
                  label={label}
                  icon={<Icon className="h-7 w-7" />}
                  className={className}
                  onClick={() => answer(id, captainType)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {QUICK_ANSWERS.map(({ id, label, icon: Icon, className }) => (
                <AnswerButton
                  key={id}
                  label={label}
                  icon={<Icon className="h-6 w-6" />}
                  className={className}
                  onClick={() => answer(id)}
                  wide
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
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

// `wide` = full-width row with the icon beside the label; otherwise the icon
// sits above the label (used for the two half-width captain buttons).
function AnswerButton({ label, icon, className, onClick, wide = false }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-lg border-2 bg-white px-2 text-sm font-semibold leading-tight text-center transition-colors active:scale-[0.98]',
        // Full-width rows are a little taller, closer to the captain buttons' height
        wide ? 'w-full flex-row gap-2 py-5 text-base' : 'flex-col gap-1 py-4',
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}
