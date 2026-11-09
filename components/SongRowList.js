import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import { PencilIcon, TrashIcon, EllipsisVerticalIcon, StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import BaseSongRow from "@/components/SongRowBase";
import SongChordsButton from "@/components/SongChordsButton";

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

function SongRowActions({ song, onEdit, onDelete, onToggleFavorite }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // The star sits at the right edge so it lines up on every row, with the
  // "more" menu (holding Delete) just past it. Clicks here, including inside
  // the menu (React bubbles portal events), must not select the row.
  return (
    <div
      className="flex items-center gap-1 md:gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <SongChordsButton song={song} />
      <SongRowButton
        icon={PencilIcon}
        onClick={onEdit}
        tooltip="Edit song"
      />
      {onToggleFavorite && (
        <FavoriteStarButton song={song} onToggleFavorite={onToggleFavorite} />
      )}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div className="inline-flex">
            <SongRowButton icon={EllipsisVerticalIcon} tooltip="More options" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
  additionalInfo
}) {
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelectionChange?.(!isSelected);
  };

  const handleRowClick = (e) => {
    // Don't trigger selection if clicking within the actions area or on links
    if (e.target.closest('.hover-action-buttons') || e.target.closest('a')) {
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
      className="cursor-pointer select-none group"
      onClick={handleRowClick}
      leftControl={
        <Checkbox
          checked={isSelected}
          onClick={handleCheckboxClick}
        />
      }
      rightActions={
        <SongRowActions
          song={song}
          onEdit={() => onEdit?.(song)}
          onDelete={() => onDelete?.(song)}
          onToggleFavorite={onToggleFavorite}
          isSelected={isSelected}
        />
      }
    />
  );
} 