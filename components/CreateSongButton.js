import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import CreateSongModal from "@/components/CreateSongModal";

export default function CreateSongButton({ 
  className = "", 
  initialTitle = "", 
  onSongCreated,
  variant = "outline" 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <PlusIcon className="h-4 w-4" />
        <span>Create Song</span>
      </Button>

      <CreateSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTitle={initialTitle}
        onSubmit={(song) => {
          onSongCreated?.(song);
        }}
      />
    </>
  );
} 