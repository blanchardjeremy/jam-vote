import { useState, useRef } from "react";
import { CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { PencilIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import CaptainSignupButton from "@/components/CaptainSignupButton";
import SongChordsButton from "@/components/SongChordsButton";
import { cn } from "@/lib/utils";

export default function SongRowButtonToolbar({ 
  song,
  jamSong,
  handleTogglePlayed,
  setIsEditModalOpen,
  onRemove,
  hostMode = false
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      <div className="flex items-center gap-1">
        <SongChordsButton song={song} />
        <CaptainSignupButton jamSong={jamSong} />
        {hostMode && (
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
        )}

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <div 
              className="inline-flex"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <SongRowButton
                icon={EllipsisVerticalIcon}
                tooltip="More options"
              />
            </div>
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
                onRemove(jamSong);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <MinusCircleIcon className="h-4 w-4 mr-2" />
              <span>Remove from jam</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
} 