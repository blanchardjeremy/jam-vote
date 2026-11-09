import { StarIcon } from '@heroicons/react/24/solid';
import BaseSongRow from '@/components/SongRowBase';

// Host view: a few favorite songs (not already in the jam) shown under a
// section's list as ideas. Display only — nothing here changes the jam.
export default function FavoriteSuggestions({ songs, hideTypeBadge = false }) {
  if (!songs?.length) return null;

  return (
    <div className="border-t-2 border-amber-200 bg-amber-50/40">
      <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
        From Favorites (Random)
      </p>
      <ul className="divide-y divide-amber-100">
        {songs.map((song) => (
          <li key={song._id}>
            <BaseSongRow
              song={song}
              hideType={hideTypeBadge}
              leftControl={
                <div className="flex w-10 justify-center md:w-11" aria-label="Favorite">
                  <StarIcon className="h-5 w-5 text-amber-500" />
                </div>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Up to `count` random favorites of the given type ('banger' | 'ballad' | null
// for any), skipping songs whose ids are in `excludeIds`.
export function pickRandomFavorites(allSongs, type, excludeIds, count = 5) {
  const candidates = (allSongs || []).filter(
    (s) => s.favorite && (!type || s.type === type) && !excludeIds.has(s._id)
  );
  // Fisher–Yates shuffle, then take the first `count`
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}
