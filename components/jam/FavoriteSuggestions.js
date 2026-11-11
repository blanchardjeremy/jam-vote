import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { PencilIcon, EllipsisVerticalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import BaseSongRow from '@/components/SongRowBase';
import SongChordsButton from '@/components/SongChordsButton';
import SongRowButton from '@/components/SongRowButton';
import SongFormModal from '@/components/CreateSongModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTapToOpenMenu } from '@/lib/hooks/useTapToOpenMenu';

// "Include favorites": a few favorite songs (not already in the jam) shown
// under a section's list as ideas. Each row has the chords button and a ⋮ menu
// (Edit song); play count / last played are left out to keep it uncluttered.
// The refresh button at the top right swaps in a new random pick.
export default function FavoriteSuggestions({ songs, hideTypeBadge = false, onSongUpdated, onRefresh }) {
  const [spinKey, setSpinKey] = useState(0);
  if (!songs?.length) return null;

  return (
    <div className="border-t-2 border-amber-200 bg-amber-50/40">
      <div className="flex items-center justify-between pl-4 pr-2 pt-2">
        <p className="pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          From Favorites (Random)
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={() => {
              setSpinKey((k) => k + 1);
              onRefresh();
            }}
            aria-label="Show different favorites"
            title="Show different favorites"
            className="rounded-md p-1.5 text-amber-700 transition-colors hover:bg-amber-100 active:bg-amber-200"
          >
            {/* Spins once per tap */}
            <ArrowPathIcon key={spinKey} className={`h-4 w-4 ${spinKey ? 'favorites-refresh-spin' : ''}`} />
          </button>
        )}
      </div>
      <ul className="divide-y divide-amber-100">
        {songs.map((song) => (
          <li key={song._id}>
            <SuggestionRow song={song} hideTypeBadge={hideTypeBadge} onSongUpdated={onSongUpdated} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionRow({ song, hideTypeBadge, onSongUpdated }) {
  const { isOpen, setIsOpen, triggerProps } = useTapToOpenMenu();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <BaseSongRow
        song={song}
        hideType={hideTypeBadge}
        hidePlayStats
        leftControl={
          <div className="flex w-10 justify-center md:w-11" aria-label="Favorite">
            <StarIcon className="h-5 w-5 text-amber-500" />
          </div>
        }
        rightActions={
          <div className="flex items-center gap-1">
            <SongChordsButton song={song} />
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <div className="inline-flex" {...triggerProps}>
                  <SongRowButton icon={EllipsisVerticalIcon} tooltip="More options" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-foreground hover:text-foreground"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  <span>Edit song</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <SongFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(updatedSong) => onSongUpdated?.(updatedSong)}
        initialData={song}
        mode="edit"
      />
    </>
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
