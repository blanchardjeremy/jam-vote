import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { useJam } from '@/components/JamContext';
import SongAutocomplete from "@/components/SongAutocomplete";

export default function JamToolbar({ 
  songAutocompleteRef, 
  handleSelectExisting, 
  handleAddNew, 
  currentSongs
}) {
  const { jam } = useJam();

  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-2 sm:gap-4 bg-white shadow-sm rounded-lg p-2 sm:p-3 border border-gray-200">
      <div className="min-w-0 flex-1 sm:max-w-xl">
        <SongAutocomplete 
          ref={songAutocompleteRef}
          onSelect={handleSelectExisting} 
          onAddNew={handleAddNew}
          currentSongs={currentSongs}
          maxWidth="w-full"
        />
      </div>

      {/* Beside the search box; just the star on phones, with its label on wider screens */}
      <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 text-gray-500 hover:text-gray-900 sm:px-3">
        <Link href={`/favorites?jam=${encodeURIComponent(jam.slug)}`} aria-label="Favorites">
          <StarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Favorites</span>
        </Link>
      </Button>
    </div>
  );
}
