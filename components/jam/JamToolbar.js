import { ArrowDownNarrowWide } from 'lucide-react';
import SongAutocomplete from "@/components/SongAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JamToolbar({ 
  songAutocompleteRef, 
  handleSelectExisting, 
  handleAddNew, 
  currentSongs, 
  sortMethod, 
  setSortMethod, 
  groupingEnabled, 
  setGroupingEnabled 
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white shadow-sm rounded-lg p-3 border border-gray-200">
      <div className="flex-1 max-w-xl">
        <SongAutocomplete 
          ref={songAutocompleteRef}
          onSelect={handleSelectExisting} 
          onAddNew={handleAddNew}
          currentSongs={currentSongs}
          maxWidth="w-full"
        />
      </div>

      {currentSongs?.length > 0 && (
        <div className="flex items-center space-x-4 ml-4">
          <Select value={sortMethod} onValueChange={setSortMethod}>
            <SelectTrigger className="w-auto border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <ArrowDownNarrowWide className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">Sort by votes</SelectItem>
              <SelectItem value="least-played">Sort by least played</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupingEnabled ? 'type' : 'none'} onValueChange={(value) => setGroupingEnabled(value === 'type')}>
            <SelectTrigger className="w-auto border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Group by banger/ballad</SelectItem>
              <SelectItem value="none">No grouping</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
} 