import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/outline';
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
    <div className="sticky top-0 z-10 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 bg-white shadow-sm rounded-lg p-2 sm:p-3 border border-gray-200">
      <div className="w-full sm:flex-1 sm:max-w-xl">
        <SongAutocomplete 
          ref={songAutocompleteRef}
          onSelect={handleSelectExisting} 
          onAddNew={handleAddNew}
          currentSongs={currentSongs}
          maxWidth="w-full"
        />
      </div>

      {/* Phones: a full-width button styled like the search box. Wider
          screens: a small link beside it. */}
      <Link
        href={`/favorites?jam=${encodeURIComponent(jam.slug)}`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-primary text-base font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-auto sm:shrink-0 sm:rounded-md sm:border-0 sm:px-3 sm:text-sm sm:text-gray-500 sm:hover:bg-accent sm:hover:text-gray-900"
      >
        <StarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
        Favorites
      </Link>
    </div>
  );
}
