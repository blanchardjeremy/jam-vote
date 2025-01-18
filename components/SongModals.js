import { useState } from 'react';
import SongFormModal from '@/components/CreateSongModal';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SongModals({ 
  editModalState, 
  onEditClose, 
  onEditSubmit,
  deleteModalState,
  onDeleteClose,
  onDeleteConfirm,
  isDeleting
}) {
  return (
    <>
      {editModalState.song && (
        <SongFormModal
          isOpen={editModalState.isOpen}
          onClose={onEditClose}
          onSubmit={onEditSubmit}
          initialData={editModalState.song}
          mode="edit"
        />
      )}

      <ConfirmDialog
        isOpen={deleteModalState.isOpen}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        title="Delete Song"
        description={deleteModalState.song ? 
          `Are you sure you want to delete "${deleteModalState.song.title}" by ${deleteModalState.song.artist}? This action cannot be undone.` :
          'Are you sure you want to delete this song?'
        }
        isLoading={isDeleting}
        confirmLoadingText="Deleting..."
      />
    </>
  );
} 