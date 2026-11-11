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
  // Your heart vote, also counted on the server
  vote: (id) => `vote-${id}`,
  // Skipped in guided voting, so it isn't offered again. Device only.
  skipped: (id) => `skip-${id}`,
  // Has been on screen in the jam list, so it's no longer new. Device only.
  viewed: (id) => `viewed-${id}`,
};

const isSet = (key) => storage.get(key) === 'true';

const captainsIt = (jamSong) => {
  const name = storage.get('userFirstName');
  return !!name && (jamSong.captains || []).some((c) => c.name === name);
};

// Has this device decided on the song yet: voted, skipped it, or captains it.
// Guided voting offers everything else.
export function isAnsweredOnThisDevice(jamSong) {
  const id = jamSong._id;
  return isSet(keys.vote(id)) || isSet(keys.skipped(id)) || captainsIt(jamSong);
}

// Songs still to go through in guided voting: unplayed, optionally one type,
// not answered yet, ranked by votes at the moment the queue is built.
export function buildQueue(songs, typeFilter) {
  return (songs || [])
    .filter((s) => !s.played)
    .filter((s) => !typeFilter || s.song?.type === typeFilter)
    .filter((s) => !isAnsweredOnThisDevice(s))
    .sort(compareByVotes)
    .map((s) => s._id);
}

// New to you: an unplayed song you haven't had on screen in the list, or
// dealt with any other way. These get the dot and the "New" filter.
export function isNewToYou(jamSong) {
  return !jamSong.played && !isSet(keys.viewed(jamSong._id)) && !isAnsweredOnThisDevice(jamSong);
}

export function markViewed(jamSongId) {
  storage.set(keys.viewed(jamSongId), 'true');
}

// This device's vote on a song, for the list view: 'voted', 'seen' or 'new'
export function voteStatus(jamSong) {
  if (isSet(keys.vote(jamSong._id))) return 'voted';
  return isNewToYou(jamSong) ? 'new' : 'seen';
}
