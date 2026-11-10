import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { StarIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useJam } from '@/components/JamContext';
import SongAutocomplete from "@/components/SongAutocomplete";

// Adding songs: an "Add Songs" button that opens the search box and "Pick
// from favorites". Starts open for a jam with no songs yet.
export default function JamToolbar({ 
  songAutocompleteRef, 
  handleSelectExisting, 
  handleAddNew, 
  currentSongs
}) {
  const { jam } = useJam();
  const [open, setOpen] = useState(() => !currentSongs?.length);
  const panelRef = useRef(null);

  const openPanel = () => {
    // Render the search box now so it can be focused inside the tap, which
    // is what lets phones show the keyboard
    flushSync(() => setOpen(true));
    panelRef.current?.querySelector('input')?.focus();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPanel}
        aria-expanded={false}
        className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-primary bg-white text-base font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:px-6"
      >
        <PlusIcon className="h-5 w-5" aria-hidden />
        Add Songs
      </button>
    );
  }

  return (
    <div ref={panelRef} className="sticky top-0 z-10 mb-4 bg-white shadow-sm rounded-lg p-2 sm:p-3 border border-gray-200">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700">Add Songs</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Add Songs"
          className="-my-1 -mr-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
          Pick from favorites
        </Link>
      </div>
    </div>
  );
}
