// Finds album art for a song by title and artist, using the iTunes Search API
// first and Deezer's search when iTunes has no match. Neither needs a key.
//
// Returns { url } on a match, { url: null } when neither service has the song,
// and throws when a service can't be reached or is rate limiting us, so the
// caller can leave the song unchecked and try again later.
//
// Plain .mjs with no path aliases so scripts/backfill-artwork.mjs can use it.

const TIMEOUT_MS = 5000;

// Albums we'd rather not show when a studio release is in the results
const AVOID_ALBUM = /\b(live|karaoke|tribute|instrumental|cover|lullaby|workout|holiday|christmas)\b/i;

const normalize = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// "The Highwomen, Brandi Carlile & Maren Morris" -> "The Highwomen"
const leadArtist = (artist) => artist.split(/,|&|\bfeat\.?|\bft\./i)[0].trim();

// "Life on Mars? (2015 Remaster)" -> "lifeonmars"
const coreTitle = (title) => normalize(title.replace(/\s*[([].*?[)\]]/g, ''));

function titleMatches(wanted, found) {
  const a = coreTitle(wanted);
  const b = coreTitle(found);
  return !!a && !!b && (a === b || b.startsWith(a) || a.startsWith(b));
}

// The artist can be a show ("Wicked") where the track is credited to the
// cast, so the album name counts too
function artistMatches(wanted, foundArtist, foundAlbum) {
  const a = normalize(leadArtist(wanted)).replace(/^the/, '');
  if (!a) return false;
  return normalize(foundArtist).includes(a) || normalize(foundAlbum).includes(a);
}

function pick(candidates, title, artist) {
  const matches = candidates.filter(
    (c) => c.image && titleMatches(title, c.title) && artistMatches(artist, c.artist, c.album)
  );
  return matches.find((c) => !AVOID_ALBUM.test(c.album)) || matches[0] || null;
}

async function getJson(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${new URL(url).host} returned ${res.status}`);
  return res.json();
}

export async function searchItunes(title, artist) {
  const term = encodeURIComponent(`${title} ${leadArtist(artist)}`);
  const data = await getJson(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=15&country=US`
  );
  const candidates = (data.results || []).map((r) => ({
    title: r.trackName || '',
    artist: r.artistName || '',
    album: r.collectionName || '',
    // The URL names its size; any size up to the original can be asked for
    image: r.artworkUrl100?.replace(/\/\d+x\d+bb\./, '/600x600bb.'),
  }));
  return pick(candidates, title, artist)?.image || null;
}

export async function searchDeezer(title, artist) {
  const q = encodeURIComponent(`${title} ${leadArtist(artist)}`);
  const data = await getJson(`https://api.deezer.com/search?q=${q}&limit=15`);
  if (data.error) throw new Error(`Deezer: ${data.error.message || 'error'}`);
  const candidates = (data.data || []).map((r) => ({
    title: r.title || '',
    artist: r.artist?.name || '',
    album: r.album?.title || '',
    image: r.album?.cover_big, // 500px
  }));
  return pick(candidates, title, artist)?.image || null;
}

export async function findArtwork(title, artist) {
  if (!title?.trim() || !artist?.trim()) return { url: null };
  let itunesError = null;
  try {
    const url = await searchItunes(title, artist);
    if (url) return { url };
  } catch (e) {
    itunesError = e;
  }
  const url = await searchDeezer(title, artist);
  if (url) return { url };
  // Only call it a miss if both services actually answered
  if (itunesError) throw itunesError;
  return { url: null };
}
