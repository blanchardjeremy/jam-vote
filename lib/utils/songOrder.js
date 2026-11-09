// Ordering for unplayed songs in a jam: most hearts first, and when hearts
// are tied, the song more people know goes first.
export function compareByVotes(a, b) {
  return (b.votes - a.votes) || ((b.knows || 0) - (a.knows || 0));
}
