import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import SongFormModal from "@/components/AddSongModal";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog";

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
    // Just pass the checked state to parent
    onSelectionChange?.(checked);
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        "border-2 border-transparent flex items-center px-4 py-3",
        isSelected && "bg-primary/5"
      )}>
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          aria-label="Select song"
          className="mr-4"
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Title, Type, and Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap flex-1">
              <h2 className="text-base md:text-lg font-semibold">
                {song.title}
              </h2>
              {!hideType && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  song.type === 'banger' 
                    ? 'bg-banger text-banger-foreground' 
                    : 'bg-jam text-jam-foreground'
                }`}>
                  {song.type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              {!isSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Middle Row: Artist and Meta Info */}
          <div className="mt-1 flex items-baseline justify-between gap-2 md:gap-4 flex-wrap">
            <p className="text-sm md:text-md text-muted-foreground font-medium">
              {song.artist}
            </p>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {song.timesPlayed > 0 && (
                <div className="hidden sm:block text-xs md:text-sm text-muted-foreground space-x-2 md:space-x-4">
                  <span>
                    <span className="ml-1">Played{' '}</span>
                    <span className="text-foreground">{song.timesPlayed} times</span>
                  </span>
                  <span>
                    <span className="ml-1">Last played on{' '}</span>
                    <span className="text-foreground">
                      {new Date(song.lastPlayed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

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
      </div>
    </TooltipProvider>
  );
} 