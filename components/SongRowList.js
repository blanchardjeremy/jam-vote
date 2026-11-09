import { Checkbox } from "@/components/ui/checkbox";
import SongRowButton from "@/components/SongRowButton";
import { PencilIcon, TrashIcon, StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import BaseSongRow from "@/components/SongRowBase";
import HoverActionButtons from "@/components/ui/hover-action-buttons";
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
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {onToggleFavorite && (
        // Filled stars always show so favorites stand out; an empty star only
        // appears on hover (mouse) like the other buttons, or always on touch.
        <div className={song.favorite ? 'flex' : 'flex [@media(hover:hover)]:opacity-0 group-hover:opacity-100'}>
          <FavoriteStarButton song={song} onToggleFavorite={onToggleFavorite} />
        </div>
      )}
      <HoverActionButtons>
        <SongChordsButton song={song} />
        <SongRowButton
          icon={PencilIcon}
          onClick={handleEdit}
          tooltip="Edit song"
        />
        <SongRowButton
          icon={TrashIcon}
          onClick={handleDelete}
          tooltip="Delete song"
          variant="danger"
        />
      </HoverActionButtons>
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