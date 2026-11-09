import { compareByVotes } from '@/lib/utils/songOrder';

// localStorage keys shared by the guided picker and the list view, so answers
// given in either place are remembered in both.
export const storage = {
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

export const keys = {
  love: (id) => `vote-${id}`,
  know: (id) => `know-${id}`,
  dontKnow: (id) => `dontknow-${id}`,
};

export function isAnsweredOnThisDevice(jamSong) {
  const id = jamSong._id;
  if (storage.get(keys.love(id)) === 'true') return true;
  if (storage.get(keys.know(id)) === 'true') return true;
  if (storage.get(keys.dontKnow(id)) === 'true') return true;
  const name = storage.get('userFirstName');
  return !!name && (jamSong.captains || []).some((c) => c.name === name);
}

// Songs still to go through: unplayed, optionally one type, not answered yet,
// ranked by hearts (then know) at the moment the queue is built.
export function buildQueue(songs, typeFilter) {
  return (songs || [])
    .filter((s) => !s.played)
    .filter((s) => !typeFilter || s.song?.type === typeFilter)
    .filter((s) => !isAnsweredOnThisDevice(s))
    .sort(compareByVotes)
    .map((s) => s._id);
}

// This device's answer for a song, for the list view:
// 'know' (said "I know it", hearted it, or captains it), 'dontKnow', or 'unanswered'.
export function answerStatus(jamSong) {
  const id = jamSong._id;
  if (storage.get(keys.know(id)) === 'true' || storage.get(keys.love(id)) === 'true') return 'know';
  const name = storage.get('userFirstName');
  if (name && (jamSong.captains || []).some((c) => c.name === name)) return 'know';
  if (storage.get(keys.dontKnow(id)) === 'true') return 'dontKnow';
  return 'unanswered';
}
