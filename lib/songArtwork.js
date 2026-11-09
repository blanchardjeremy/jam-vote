import { findArtwork } from '@/lib/artwork.mjs';

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
