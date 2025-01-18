// Simple fuzzy search that's case-insensitive and allows for partial matches
export function fuzzyMatch(text, query) {
  if (!query) return true;
  if (!text) return false;
  
  text = String(text).toLowerCase();
  query = String(query).toLowerCase();
  
  let queryIndex = 0;
  
  // Check if characters appear in sequence
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      queryIndex++;
    }
  }
  
  // Return true if all characters in query were found in sequence
  return queryIndex === query.length;
}

// Helper to check if any string in an array matches the query
export function fuzzyMatchAny(items, query) {
  if (!query) return true;
  if (!items?.length) return false;
  return items.some(item => fuzzyMatch(item, query));
}

// Multi-field fuzzy search for song objects
export function fuzzySearchSong(song, query, fields = ['title', 'artist']) {
  if (!query) return true;
  if (!song) return false;
  
  // Split query into words for better partial matching
  const words = query.toLowerCase().split(/\s+/);
  
  return words.every(word => {
    // Check each specified field
    return fields.some(field => {
      const value = song[field];
      if (!value) return false;
      return fuzzyMatch(value, word);
    });
  });
} 