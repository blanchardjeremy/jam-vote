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
import CaptainButtons from "@/components/CaptainButtons";
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
  const tapStart = useRef(null);

  // The menu normally opens on finger-down, so a scroll that starts on the
  // button would open it. For touch, open only on a tap that didn't move.
  // A scroll fires pointercancel, so pointerup never arrives for it.
  const handleTriggerPointerDown = (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    tapStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleTriggerPointerUp = (e) => {
    const start = tapStart.current;
    tapStart.current = null;
    if (!start) return;
    if (Math.abs(e.clientX - start.x) < 10 && Math.abs(e.clientY - start.y) < 10) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <SongChordsButton song={song} />
        {/* Host mode swaps the captain buttons for the sung button, to keep
            the row from getting crowded */}
        {!hostMode && <CaptainButtons jamSong={jamSong} />}
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
              onPointerDown={handleTriggerPointerDown}
              onPointerUp={handleTriggerPointerUp}
              onPointerCancel={() => { tapStart.current = null; }}
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