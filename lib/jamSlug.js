// Simple adjectives (max 4 letters)
const ADJECTIVES = [
  // Colors
  'red', 'blue', 'pink', 'gold', 'gray',
  
  // Size/Age
  'big', 'tiny', 'old', 'new', 'wild',
  
  // Feel/Mood
  'cool', 'warm', 'soft', 'bold', 'fun',
  'rad', 'hot', 'fast', 'slow',
  'deep', 'dark',
];

// Music-related nouns (max 4 letters)
const NOUNS = [
  // Instruments & Sound
  'drum', 'beat', 'sax', 'horn',
  'keys', 'bell', 'band', 'harp',
  
  // Styles
  'jazz', 'rock', 'funk', 'soul', 'folk',
  'pop', 'rap', 'edm',
  
  // Music Terms
  'song', 'tune', 'jam', 'solo',
  'note', 'duo', 'mix', 'loop', 'vibe'
];

export function generateJamSlug() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}-${noun}`;
}