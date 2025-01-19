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
    // Calculate play counts once for potential secondary sorting
    const aPlays = a.playHistory?.length || 0;
    const bPlays = b.playHistory?.length || 0;
    const aUniquePlays = a.timesPlayed || 0;
    const bUniquePlays = b.timesPlayed || 0;

    // Primary sort based on selected field
    let primarySort = 0;
    switch (field) {
      case 'dateAdded':
        primarySort = multiplier * (new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'count':
        // For count, we already use a two-tier system
        if (aPlays !== bPlays) {
          return multiplier * (aPlays - bPlays);
        }
        return multiplier * (aUniquePlays - bUniquePlays);
      case 'lastPlayed':
        const aLastPlayed = a.playHistory?.length ? 
          new Date(a.playHistory[a.playHistory.length - 1].date) : 
          new Date(0);
        const bLastPlayed = b.playHistory?.length ? 
          new Date(b.playHistory[b.playHistory.length - 1].date) : 
          new Date(0);
        primarySort = multiplier * (aLastPlayed - bLastPlayed);
        break;
      default:
        return 0;
    }

    // If primary sort yields equal results and we're not already sorting by count,
    // use play count as a secondary sort criterion (most played first)
    if (primarySort === 0 && field !== 'count') {
      // First try total plays
      if (aPlays !== bPlays) {
        return -(aPlays - bPlays); // Note: Negative to always sort most played first
      }
      // Then try unique plays
      return -(aUniquePlays - bUniquePlays);
    }

    return primarySort;
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