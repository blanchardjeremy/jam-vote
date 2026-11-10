import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { StarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useJam } from '@/components/JamContext';
import SongAutocomplete from "@/components/SongAutocomplete";
import { Button } from "@/components/ui/button";
import GuidedVotingButton, { jamActionButtonClass } from '@/components/jam/GuidedVotingButton';

// The jam's two main actions side by side: "Add Songs" (opens the search box
// and "Pick from favorites" below) and Guided voting. The add panel starts
// open for a jam with no songs yet.
export default function JamToolbar({ 
  songAutocompleteRef, 
  handleSelectExisting, 
  handleAddNew, 
  currentSongs
}) {
  const { jam } = useJam();
  const [open, setOpen] = useState(() => !currentSongs?.length);
  const panelRef = useRef(null);

  const togglePanel = () => {
    if (open) {
      setOpen(false);
      return;
    }
    // Render the search box now so it can be focused inside the tap, which
    // is what lets phones show the keyboard
    flushSync(() => setOpen(true));
    panelRef.current?.querySelector('input')?.focus();
  };

  return (
    <>
    <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:justify-start">
      <Button variant="outline" onClick={togglePanel} aria-expanded={open} className={jamActionButtonClass}>
        <PlusIcon className="h-5 w-5" aria-hidden />
        Add Songs
      </Button>
      {currentSongs?.length > 0 && <GuidedVotingButton />}
    </div>

    {open && (
    <div ref={panelRef} className="sticky top-0 z-10 mb-4 bg-white shadow-sm rounded-lg p-2 sm:p-3 border border-gray-200">
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
    )}
    </>
  );
}
