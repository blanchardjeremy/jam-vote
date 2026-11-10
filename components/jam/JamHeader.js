import { MoreVertical, Check } from 'lucide-react';
import { TrashIcon, WrenchScrewdriverIcon, StarIcon } from '@heroicons/react/24/solid';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJam } from '@/components/JamContext';

export default function JamHeader({ onDeleteClick, hostMode, setHostMode, showFavorites, setShowFavorites }) {
  const { jam } = useJam();

  return (
    <div className="mb-6 sm:mb-8">
      {/* Title on the left, jam options menu on the right. Guided voting
          lives on the filter row above the song list. */}
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{jam.name}</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">
              {new Date(jam.jamDate).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open jam options"
                className="-mr-2 shrink-0 sm:mr-0"
              >
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowFavorites(!showFavorites)}
                role="menuitemcheckbox"
                aria-checked={showFavorites}
              >
                <StarIcon className="h-4 w-4 mr-2" />
                Include favorites
                {showFavorites && <Check className="h-4 w-4 ml-auto pl-1" aria-hidden />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHostMode(!hostMode)}>
                <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                {hostMode ? 'Disable' : 'Enable'} Host Tools
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={onDeleteClick}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Jam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </div>
  );
} 