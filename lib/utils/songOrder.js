// Ordering for unplayed songs in a jam: most votes first. Ties keep their
// current order.
export function compareByVotes(a, b) {
  return b.votes - a.votes;
}
