import { useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import { PencilIcon, TrashIcon, EllipsisVerticalIcon, MusicalNoteIcon, PlusIcon, CheckIcon, StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import BaseSongRow from "@/components/SongRowBase";
import SongChordsButton, { chordUrl } from "@/components/SongChordsButton";

function FavoriteStarButton({ song, onToggleFavorite }) {
  return (
    <SongRowButton
      icon={song.favorite ? StarSolid : StarOutline}
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(song._id, !song.favorite);
      }}
      tooltip={song.favorite ? 'Remove from favorites' : 'Add to favorites'}
      className={song.favorite ? 'text-amber-500 hover:text-amber-600' : ''}
    />
  );
}

// "+" adds this one song to the jam. Songs already in it show a check.
function AddToJamButton({ song, inJam, onAddToJam }) {
  if (inJam) {
    return (
      <span
        role="img"
        aria-label="Already in this jam"
        className="p-0.5 text-green-600 sm:p-1"
      >
        <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
    );
  }
  return (
    <SongRowButton
      icon={PlusIcon}
      onClick={() => onAddToJam(song)}
      tooltip="Add to jam"
      className="text-primary hover:text-primary hover:bg-primary/10"
    />
  );
}

function SongRowActions({ song, onEdit, onDelete, onToggleFavorite, actionsInMenu, onAddToJam, inJam }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      setIsMenuOpen(true);
    }
  };

  // The star sits at the right edge so it lines up on every row, with the
  // "more" menu (holding Delete) just past it. Clicks here, including inside
  // the menu (React bubbles portal events), must not select the row.
  return (
    <div
      className="flex items-center gap-1 md:gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {/* With actionsInMenu, Chords, Edit and the star move into the ⋮ menu */}
      {!actionsInMenu && (
        <>
          <SongChordsButton song={song} />
          <SongRowButton
            icon={PencilIcon}
            onClick={onEdit}
            tooltip="Edit song"
          />
        </>
      )}
      {onAddToJam && (
        <AddToJamButton song={song} inJam={inJam} onAddToJam={onAddToJam} />
      )}
      {onToggleFavorite && !actionsInMenu && (
        <FavoriteStarButton song={song} onToggleFavorite={onToggleFavorite} />
      )}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div
            className="inline-flex"
            onPointerDown={handleTriggerPointerDown}
            onPointerUp={handleTriggerPointerUp}
            onPointerCancel={() => { tapStart.current = null; }}
          >
            <SongRowButton icon={EllipsisVerticalIcon} tooltip="More options" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actionsInMenu && (
            <>
              <DropdownMenuItem asChild>
                <a href={chordUrl(song)} target="_blank" rel="noopener noreferrer">
                  <MusicalNoteIcon className="h-4 w-4 mr-2" />
                  <span>Chords & lyrics</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                <span>Edit song</span>
              </DropdownMenuItem>
              {onToggleFavorite && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleFavorite(song._id, !song.favorite);
                  }}
                >
                  {song.favorite
                    ? <StarSolid className="h-4 w-4 mr-2 text-amber-500" />
                    : <StarOutline className="h-4 w-4 mr-2" />}
                  <span>{song.favorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuItem
            onClick={() => {
              setIsMenuOpen(false);
              onDelete();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            <span>Delete song</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function SongListRow({ 
  song, 
  onEdit, 
  onDelete,
  onToggleFavorite,
  isSelected,
  onSelectionChange,
  hideType,
  additionalInfo,
  actionsInMenu = false,
  onAddToJam,
  inJam = false,
}) {
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelectionChange?.(!isSelected);
  };

  const handleRowClick = (e) => {
    // Don't trigger selection when clicking a link. The actions area stops
    // its own clicks before they get here.
    if (e.target.closest('a')) {
      return;
    }
    onSelectionChange?.(!isSelected);
  };
  
  return (
    <BaseSongRow
      song={song}
      isSelected={isSelected}
      hideType={hideType}
      additionalInfo={additionalInfo}
      // Rows are selectable only when the page passes onSelectionChange
      className={onSelectionChange ? "cursor-pointer select-none group" : "group"}
      onClick={onSelectionChange ? handleRowClick : undefined}
      leftControl={onSelectionChange && (
        <Checkbox
          checked={isSelected}
          onClick={handleCheckboxClick}
        />
      )}
      rightActions={
        <SongRowActions
          song={song}
          onEdit={() => onEdit?.(song)}
          onDelete={() => onDelete?.(song)}
          onToggleFavorite={onToggleFavorite}
          actionsInMenu={actionsInMenu}
          onAddToJam={onAddToJam}
          inJam={inJam}
        />
      }
    />
  );
} 