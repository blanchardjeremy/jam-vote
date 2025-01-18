import { Checkbox } from "@/components/ui/checkbox";
import SongRowButton from "@/components/SongRowButton";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import BaseSongRow from "@/components/SongRowBase";

function SongRowActions({ onEdit, onDelete, isSelected }) {
  return (
    <div>
      {/* Desktop/Mouse view - show on hover */}
      <div className="hidden [@media(hover:hover)]:flex [@media(hover:hover)]:opacity-0 group-hover:opacity-100 items-center gap-1 md:gap-2">
        <SongRowButton
          icon={PencilIcon}
          onClick={onEdit}
          tooltip="Edit song"
        />
        <SongRowButton
          icon={TrashIcon}
          onClick={onDelete}
          tooltip="Delete song"
          variant="danger"
        />
      </div>

      {/* Touch device view - always show */}
      <div className="[@media(hover:hover)]:hidden flex items-center gap-1 md:gap-2">
        <SongRowButton
          icon={PencilIcon}
          onClick={onEdit}
          tooltip="Edit song"
        />
        <SongRowButton
          icon={TrashIcon}
          onClick={onDelete}
          tooltip="Delete song"
          variant="danger"
        />
      </div>
    </div>
  );
}

export default function SongListRow({ 
  song, 
  onEdit, 
  onDelete,
  isSelected,
  onSelectionChange,
  hideType 
}) {
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelectionChange?.(!isSelected);
  };

  const handleRowClick = (e) => {
    // Don't trigger selection if clicking on buttons or dropdown
    if (e.target.closest('button') || e.target.closest('[role="menuitem"]')) {
      return;
    }
    onSelectionChange?.(!isSelected);
  };
  
  return (
    <BaseSongRow
      song={song}
      isSelected={isSelected}
      hideType={hideType}
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
          onEdit={() => onEdit?.(song)}
          onDelete={() => onDelete?.(song)}
          isSelected={isSelected}
        />
      }
    />
  );
} 