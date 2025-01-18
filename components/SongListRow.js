import { useState } from "react";
import SongFormModal from "@/components/AddSongModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog";
import BaseSongRow from "@/components/SongRowBase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SongRowActions({ onEdit, onDelete, isSelected }) {
  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {!isSelected && (
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleEdit = async (updatedSong) => {
    onEdit?.(song._id, updatedSong);
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(song._id);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckboxChange = (checked) => {
    onSelectionChange?.(checked);
  };
  
  return (
    <>
      <BaseSongRow
        song={song}
        isSelected={isSelected}
        hideType={hideType}
        leftControl={
          <div
            onClick={() => handleCheckboxChange(!isSelected)}
            className="p-2 -m-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
            role="presentation"
          >
            <Checkbox
              checked={isSelected}
              className="pointer-events-none"
            />
          </div>
        }
        rightActions={
          <SongRowActions
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setShowDeleteDialog(true)}
            isSelected={isSelected}
          />
        }
      />

      {/* Modals */}
      <SongFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        initialData={song}
        mode="edit"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Song"
        description={`Are you sure you want to delete "${song.title}" by ${song.artist}? This action cannot be undone.`}
        isLoading={isDeleting}
        confirmLoadingText="Deleting..."
      />
    </>
  );
} 