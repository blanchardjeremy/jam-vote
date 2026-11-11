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
  // You've seen the song (skipped it in guided voting, tapped it in the list,
  // or took your vote back). Kept on this device only.
  seen: (id) => `seen-${id}`,
};

const isSet = (key) => storage.get(key) === 'true';

const captainsIt = (jamSong) => {
  const name = storage.get('userFirstName');
  return !!name && (jamSong.captains || []).some((c) => c.name === name);
};

// Has this device dealt with the song yet: voted, seen it, or captains it
export function isAnsweredOnThisDevice(jamSong) {
  const id = jamSong._id;
  return isSet(keys.vote(id)) || isSet(keys.seen(id)) || captainsIt(jamSong);
}

// Songs still to go through: unplayed, optionally one type, not answered yet,
// ranked by votes at the moment the queue is built.
export function buildQueue(songs, typeFilter) {
  return (songs || [])
    .filter((s) => !s.played)
    .filter((s) => !typeFilter || s.song?.type === typeFilter)
    .filter((s) => !isAnsweredOnThisDevice(s))
    .sort(compareByVotes)
    .map((s) => s._id);
}

// This device's vote on a song, for the list view: 'voted', 'seen' or 'new'
export function voteStatus(jamSong) {
  if (isSet(keys.vote(jamSong._id))) return 'voted';
  return isAnsweredOnThisDevice(jamSong) ? 'seen' : 'new';
}
