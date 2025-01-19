import { Checkbox } from "@/components/ui/checkbox";
import SongRowButton from "@/components/SongRowButton";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import BaseSongRow from "@/components/SongRowBase";
import HoverActionButtons from "@/components/ui/hover-action-buttons";
import SongChordsButton from "@/components/SongChordsButton";

function SongRowActions({ song, onEdit, onDelete }) {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
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
          isSelected={isSelected}
        />
      }
    />
  );
} 