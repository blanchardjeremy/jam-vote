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
        variant="success"
        tooltip={jamSong.played ? 'Mark as not played' : 'Mark as played'}
        className={jamSong.played 
          ? 'text-success hover:text-success hover:bg-success-muted' 
          : 'text-success hover:text-success hover:bg-success-muted'
        }
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 ease-in-out">
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsEditModalOpen(true)}
            className="text-foreground hover:text-foreground"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            <span>Edit song</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            <span>Remove from jam</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 