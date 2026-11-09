import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { PencilIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
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
export default function FavoriteSuggestions({ songs, hideTypeBadge = false, onSongUpdated }) {
  if (!songs?.length) return null;

  return (
    <div className="border-t-2 border-amber-200 bg-amber-50/40">
      <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
        From Favorites (Random)
      </p>
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
