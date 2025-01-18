import { useState } from 'react';
import { Button } from "@/components/ui/button";
import SelectJamModal from './SelectJamModal';
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function AddSongToTargetJamButton({ onJamSelected, selectedCount = 0 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJamSelected = async (jam) => {
    try {
      console.log('[AddSongToTargetJamButton] Calling onJamSelected with jam:', jam);
      const result = await onJamSelected(jam);
      console.log('[AddSongToTargetJamButton] Result from onJamSelected:', result);
      
      setIsModalOpen(false);
      
      if (!result) {
        console.error('[AddSongToTargetJamButton] No result returned from onJamSelected');
        toast.error('Failed to add songs to jam');
        return;
      }
      
      if (result.addedSongs?.length > 0) {
        toast.success(`Added ${result.addedSongs.length} ${result.addedSongs.length === 1 ? 'song' : 'songs'} to ${jam.name}`, {
          action: {
            label: 'View Jam',
            onClick: () => window.open(`/jams/${jam._id}`, '_blank'),
          },
        });
      }
      
      if (result.skippedSongs?.length > 0) {
        toast.info(`${result.skippedSongs.length} ${result.skippedSongs.length === 1 ? 'song was' : 'songs were'} already in the jam`);
      }
      
      if (!result.addedSongs?.length && !result.skippedSongs?.length) {
        toast.success('Added to jam', {
          action: {
            label: 'View Jam',
            onClick: () => window.open(`/jams/${jam._id}`, '_blank'),
          },
        });
      }
    } catch (error) {
      console.error('[AddSongToTargetJamButton] Error:', error);
      toast.error('Failed to add songs to jam');
    }
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={selectedCount === 0}
        className="flex items-center gap-2"
      >
        <span>
          {selectedCount === 0 
            ? "Add to Jam" 
            : `Add ${selectedCount} to Jam`}
        </span>
        <ArrowRightIcon className="h-4 w-4" />
      </Button>

      <SelectJamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleJamSelected}
      />
    </>
  );
} 