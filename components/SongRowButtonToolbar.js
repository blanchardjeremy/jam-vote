import { useState, useRef } from "react";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { TrashIcon, PencilIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import CaptainSignupButton from "@/components/CaptainSignupButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

export default function SongRowButtonToolbar({ 
  song,
  jamSong,
  handleTogglePlayed,
  setIsEditModalOpen,
  onRemove
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const touchStartPos = useRef(null);
  
  const handleTouchStart = (e) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStartPos.current) return;
    
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartPos.current.x);
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartPos.current.y);
    
    // If movement was minimal (less than 10px), treat it as a tap
    if (deltaX < 10 && deltaY < 10) {
      setIsOpen(true);
    }
    touchStartPos.current = null;
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove?.();
      setShowRemoveDialog(false);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
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
            : 'hover:text-success hover:bg-success-muted'
          }
        />

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button 
              className="inline-flex"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <SongRowButton
                icon={EllipsisVerticalIcon}
                tooltip="More options"
              />
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
              onClick={() => {
                setIsOpen(false);
                setShowRemoveDialog(true);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              <span>Remove from jam</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => setShowRemoveDialog(false)}
        onConfirm={handleRemove}
        title="Remove Song"
        description={`Are you sure you want to remove "${song.title}" by ${song.artist} from this jam?`}
        confirmText="Remove"
        isLoading={isRemoving}
        confirmLoadingText="Removing..."
      />
    </>
  );
} 