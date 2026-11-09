import { AcademicCapIcon as CapOutline } from "@heroicons/react/24/outline";
import { AcademicCapIcon as CapSolid } from "@heroicons/react/24/solid";
import { useState, useCallback, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// "I know this song" toggle, shown next to the heart. Like the heart, each
// device remembers its own choice in localStorage.
export default function SongKnowButton({ jamSong, onKnow }) {
  const [isSaving, setIsSaving] = useState(false);
  const [knowsSong, setKnowsSong] = useState(false);
  const storageKey = `know-${jamSong._id}`;

  useEffect(() => {
    setKnowsSong(localStorage.getItem(storageKey) === 'true');
  }, [storageKey, jamSong.knows]);

  const handleClick = useCallback(async () => {
    if (isSaving || !onKnow) return;

    const newState = !knowsSong;
    setKnowsSong(newState);
    setIsSaving(true);
    if (newState) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }

    try {
      await onKnow(jamSong._id, newState ? 'know' : 'unknow');
    } catch (error) {
      // Revert on error
      setKnowsSong(!newState);
      if (newState) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, 'true');
      }
      console.error('Error marking song as known:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, knowsSong, jamSong._id, onKnow, storageKey]);

  const Icon = knowsSong ? CapSolid : CapOutline;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          disabled={isSaving}
          aria-pressed={knowsSong}
          aria-label={knowsSong ? "I don't know this song" : 'I know this song'}
          className={cn(
            'flex flex-col items-center p-0 px-1 md:px-2 rounded-lg transition-all duration-150 ease-in-out z-0',
            jamSong.played
              ? 'pointer-events-none'
              : 'hover:bg-primary/5',
            knowsSong && !jamSong.played ? 'text-primary' : 'text-primary/60 hover:text-primary'
          )}
        >
          <Icon className="h-6 w-6 md:h-7 md:w-7" />
          <span className="text-xs md:text-sm font-medium text-primary">{jamSong.knows || 0}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{knowsSong ? "Unmark: I don't know this song" : 'I know this song'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
