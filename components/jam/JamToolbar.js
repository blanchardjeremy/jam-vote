import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { useJam } from '@/components/JamContext';
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
  groupingEnabled, 
  setGroupingEnabled 
}) {
  const { jam } = useJam();

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

      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900">
          <Link href={`/favorites?jam=${encodeURIComponent(jam.slug)}`}>
            <StarIcon className="h-4 w-4" />
            Favorites
          </Link>
        </Button>

        {currentSongs?.length > 0 && (
          <Select value={groupingEnabled ? 'type' : 'none'} onValueChange={(value) => setGroupingEnabled(value === 'type')}>
            <SelectTrigger className="w-auto border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Group by banger/ballad</SelectItem>
              <SelectItem value="none">No grouping</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
} 