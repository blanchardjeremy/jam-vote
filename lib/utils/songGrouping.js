// Helper function to sort within groups
const sortWithinGroup = (songs, isPlayed = false) => {
  return [...songs].sort((a, b) => {
    if (isPlayed) {
      // For played songs, sort by playedAt timestamp (oldest first)
      const aTime = a.playedAt ? new Date(a.playedAt).getTime() : 0;
      const bTime = b.playedAt ? new Date(b.playedAt).getTime() : 0;
      return aTime - bTime;
    } else {
      // For unplayed songs, sort by votes
      return b.votes - a.votes;
    }
  });
};

export function getGroupedSongs(songs, groupingEnabled = true) {
  if (!Array.isArray(songs)) {
    console.warn('getGroupedSongs received non-array songs:', songs);
    return {
      bangers: [],
      ballads: [],
      ungrouped: [],
      nextSongId: null
    };
  }

  // First split into played and unplayed
  const playedSongs = songs.filter(song => song.played);
  const unplayedSongs = songs.filter(song => !song.played);

  if (!groupingEnabled) {
    // Even in ungrouped view, we still want played songs at the top
    const sortedPlayed = sortWithinGroup(playedSongs, true);
    const sortedUnplayed = sortWithinGroup(unplayedSongs, false);
    
    // Find next unplayed song
    const nextSongId = sortedUnplayed[0]?._id;
    
    return { 
      ungrouped: [...sortedPlayed, ...sortedUnplayed],
      nextSongId 
    };
  }

  // For grouped view, split each played status group into bangers and ballads
  const playedBangers = sortWithinGroup(playedSongs.filter(song => song.song.type === 'banger'), true);
  const playedBallads = sortWithinGroup(playedSongs.filter(song => song.song.type === 'ballad'), true);
  const unplayedBangers = sortWithinGroup(unplayedSongs.filter(song => song.song.type === 'banger'), false);
  const unplayedBallads = sortWithinGroup(unplayedSongs.filter(song => song.song.type === 'ballad'), false);

  // Find next unplayed song - first check bangers, then ballads
  const nextSongId = unplayedBangers[0]?._id || unplayedBallads[0]?._id;

  return {
    bangers: [...playedBangers, ...unplayedBangers],
    ballads: [...playedBallads, ...unplayedBallads],
    nextSongId
  };
} 