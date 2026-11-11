// Ordering for unplayed songs in a jam: most votes first. When votes are
// tied, songs that already have a captain go first, since someone is ready
// to lead them. Remaining ties keep their current order.
export function compareByVotes(a, b) {
  const hasCaptain = (s) => (s.captains?.length ? 1 : 0);
  return (b.votes - a.votes) || (hasCaptain(b) - hasCaptain(a));
}
