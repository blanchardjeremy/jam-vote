import SongAutocomplete from "@/components/SongAutocomplete";

export default function JamToolbar({ 
  songAutocompleteRef, 
  handleSelectExisting, 
  handleAddNew, 
  currentSongs
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4 bg-white shadow-sm rounded-lg p-2 sm:p-3 border border-gray-200">
      <div className="w-full sm:flex-1 sm:max-w-xl">
        <SongAutocomplete 
          ref={songAutocompleteRef}
          onSelect={handleSelectExisting} 
          onAddNew={handleAddNew}
          currentSongs={currentSongs}
          maxWidth="w-full"
        />
      </div>
    </div>
  );
} 
