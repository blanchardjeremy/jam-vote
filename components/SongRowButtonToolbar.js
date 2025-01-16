import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { TrashIcon, PencilIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import CaptainSignupButton from "@/components/CaptainSignupButton";
import { cn } from "@/lib/utils";

export default function SongRowButtonToolbar({ 
  song,
  jamSong,
  handleTogglePlayed,
  isTogglingPlayed,
  setIsEditModalOpen,
  onRemove
}) {
  return (
    <div className="flex items-center gap-1">
      {song.chordChart && (
        <SongRowButton
          icon={MusicalNoteIcon}
          href={song.chordChart}
          tooltip="View chord chart"
        />
      )}
      <CaptainSignupButton jamSong={jamSong} />
      <SongRowButton
        icon={jamSong.played ? CheckCircleSolid : CheckCircleIcon}
        onClick={handleTogglePlayed}
        disabled={isTogglingPlayed}
        isLoading={isTogglingPlayed}
        variant="success"
        tooltip={jamSong.played ? 'Mark as not played' : 'Mark as played'}
        className={jamSong.played 
          ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
          : 'hover:text-green-600 hover:bg-green-50'
        }
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-150 ease-in-out">
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsEditModalOpen(true)}
            className="text-gray-700 hover:text-gray-900"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            <span>Edit song</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            <span>Remove from jam</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 