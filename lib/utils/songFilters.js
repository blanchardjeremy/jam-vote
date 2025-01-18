import { fuzzySearchSong } from './fuzzyMatch';

// Filter songs by type (banger/ballad)
export function filterByType(songs, type) {
  if (!type || type === 'all') return songs;
  return songs.filter(song => song.type === type);
}

// Filter songs by search query across multiple fields
export function filterBySearch(songs, query) {
  if (!query) return songs;
  return songs.filter(song => 
    fuzzySearchSong(song, query, ['title', 'artist', 'tags'])
  );
}

// Sort songs by different criteria
export function sortSongs(songs, sortOption) {
  const [field, direction] = sortOption.split('_');
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...songs].sort((a, b) => {
    switch (field) {
      case 'dateAdded':
        return multiplier * (new Date(a.createdAt) - new Date(b.createdAt));
      case 'count':
        // First try total plays (playHistory length)
        const aPlays = a.playHistory?.length || 0;
        const bPlays = b.playHistory?.length || 0;
        if (aPlays !== bPlays) {
          return multiplier * (aPlays - bPlays);
        }
        // If total plays are equal, use unique jam plays (timesPlayed)
        return multiplier * ((a.timesPlayed || 0) - (b.timesPlayed || 0));
      case 'lastPlayed':
        // Get the most recent play date from playHistory
        const aLastPlayed = a.playHistory?.length ? 
          new Date(a.playHistory[a.playHistory.length - 1].date) : 
          new Date(0);
        const bLastPlayed = b.playHistory?.length ? 
          new Date(b.playHistory[b.playHistory.length - 1].date) : 
          new Date(0);
        return multiplier * (aLastPlayed - bLastPlayed);
      default:
        return 0;
    }
  });
}

// Main function that applies all filters and sorting in the correct order
export function applySongFilters(songs, filters) {
  // 1. First sort all songs
  let result = sortSongs(songs, filters.sort);
  
  // 2. Then filter by type (this preserves the sort order within each type)
  result = filterByType(result, filters.type);
  
  // 3. Finally filter by search query
  result = filterBySearch(result, filters.query);
  
  // Debug logging
  console.log('First 10 songs after filtering:', result.slice(0, 10).map(song => ({
    title: song.title,
    artist: song.artist,
    type: song.type,
    totalPlays: song.playHistory?.length || 0,
    uniqueJamPlays: song.timesPlayed || 0,
    sort: filters.sort
  })));
  
  return result;
} 