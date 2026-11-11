import { compareByVotes } from '@/lib/utils/songOrder';

// Sung songs in the order they were sung (first one first)
const byPlayedAt = (a, b) => {
  const aTime = a.playedAt ? new Date(a.playedAt).getTime() : 0;
  const bTime = b.playedAt ? new Date(b.playedAt).getTime() : 0;
  return aTime - bTime;
};

// Splits a jam's songs for the list. Songs still to sing are ranked by votes,
// in Bangers and Ballads (or one ungrouped list), so the top of each is the
// next one up. Sung songs move to their own list, shown last.
export function getGroupedSongs(songs, groupingEnabled = true) {
  if (!Array.isArray(songs)) {
    console.warn('getGroupedSongs received non-array songs:', songs);
    return { bangers: [], ballads: [], ungrouped: [], sung: [], nextSongId: null };
  }

  const toSing = songs.filter((song) => !song.played).sort(compareByVotes);
  const sung = songs.filter((song) => song.played).sort(byPlayedAt);

  if (!groupingEnabled) {
    return { ungrouped: toSing, sung, nextSongId: toSing[0]?._id };
  }

  const bangers = toSing.filter((song) => song.song.type === 'banger');
  const ballads = toSing.filter((song) => song.song.type === 'ballad');
  return {
    bangers,
    ballads,
    sung,
    // Bangers come first
    nextSongId: bangers[0]?._id || ballads[0]?._id,
  };
}
