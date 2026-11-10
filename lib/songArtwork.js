import { findArtwork } from '@/lib/artwork.mjs';
import Song from '@/models/Song';

// The artwork fields to save for a song with this title and artist. A failed
// lookup (a service down or rate limiting) leaves the song unchecked, so the
// backfill script can try it again later; saving the song never fails over art.
export async function artworkFields(title, artist) {
  try {
    const { url } = await findArtwork(title, artist);
    return { artworkUrl: url, artworkCheckedAt: new Date() };
  } catch (error) {
    console.warn(`Artwork lookup failed for "${title}" by ${artist}: ${error.message}`);
    return { artworkUrl: null, artworkCheckedAt: null };
  }
}

// Songs whose art is being looked up right now, so overlapping page loads
// don't search for the same song twice
const inFlight = new Set();
// After a failed lookup, wait before trying again so a rate limit can clear
const RETRY_PAUSE_MS = 5 * 60 * 1000;
let pausedUntil = 0;

// Looks up art for a few songs that were never checked (their lookup failed
// when they were added). Pages call this after responding, so the art shows
// up on the next load. Stops at the first failure.
export async function fillMissingArtwork(songs, max = 5) {
  if (Date.now() < pausedUntil) return;
  const todo = songs
    .filter((s) => s?._id && !s.artworkCheckedAt && !inFlight.has(String(s._id)))
    .slice(0, max);
  if (!todo.length) return;

  todo.forEach((s) => inFlight.add(String(s._id)));
  try {
    for (const song of todo) {
      let url;
      try {
        ({ url } = await findArtwork(song.title, song.artist));
      } catch (error) {
        console.warn(`Artwork retry failed for "${song.title}": ${error.message}`);
        pausedUntil = Date.now() + RETRY_PAUSE_MS;
        return;
      }
      // Skip it if the art was set by hand in the meantime
      await Song.updateOne(
        { _id: song._id, artworkCheckedAt: null },
        { $set: { artworkUrl: url, artworkCheckedAt: new Date() } }
      );
    }
  } finally {
    todo.forEach((s) => inFlight.delete(String(s._id)));
  }
}
