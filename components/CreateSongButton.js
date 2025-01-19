import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import CreateSongModal from "@/components/CreateSongModal";

export default function CreateSongButton({ 
  label = "Create Song",
  className = "", 
  initialTitle = "", 
  onSongCreated,
  onDuplicateSelect,
  variant = "outline" 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = (duplicateSong) => {
    setIsModalOpen(false);
    if (duplicateSong) {
      onDuplicateSelect?.(duplicateSong);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <DocumentPlusIcon className="h-4 w-4" />
        <span>{label}</span>
      </Button>

      <CreateSongModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialTitle={initialTitle}
        onSubmit={(song) => {
          onSongCreated?.(song);
        }}
      />
    </>
  );
} 