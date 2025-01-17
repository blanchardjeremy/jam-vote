// API calls for song operations
export async function updateSong(songId, updatedSong) {
  const res = await fetch(`/api/songs/${songId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedSong)
  });

  if (!res.ok) {
    let errorMessage = `Failed to update song (HTTP ${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Add response status text if available
      if (res.statusText) {
        errorMessage += `: ${res.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function deleteSong(songId) {
  const res = await fetch(`/api/songs/${songId}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    let errorMessage = `Failed to delete song (HTTP ${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Add response status text if available
      if (res.statusText) {
        errorMessage += `: ${res.statusText}`;
      }
      // Add more context for common status codes
      if (res.status === 404) {
        errorMessage += ' - Song not found';
      } else if (res.status === 403) {
        errorMessage += ' - Permission denied';
      } else if (res.status === 401) {
        errorMessage += ' - Unauthorized';
      }
    }
    throw new Error(errorMessage);
  }

  // For DELETE operations, we don't need to return anything if successful
  return { success: true };
}

export async function fetchSongs() {
  const res = await fetch('/api/songs');
  
  if (!res.ok) {
    let errorMessage = `Failed to fetch songs (HTTP ${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Add response status text if available
      if (res.statusText) {
        errorMessage += `: ${res.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

// Optimistic update helpers
export function optimisticallyUpdateSong(songs, songId, updatedSong) {
  return songs.map(song => 
    song._id === songId ? { ...song, ...updatedSong } : song
  );
}

export function optimisticallyDeleteSong(songs, songId) {
  return songs.filter(song => song._id !== songId);
}

// Hooks for components that need song operations
export function useSongOperations({ 
  songs, 
  setSongs, 
  selectedSongs, 
  setSelectedSongs,
  onSuccess,
  onError 
}) {
  const handleEdit = async (songId, updatedSong) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => optimisticallyUpdateSong(prevSongs, songId, updatedSong));

      // Make API call
      await updateSong(songId, updatedSong);
      
      onSuccess?.('Song updated successfully');
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error updating song:', e);
      onError?.(e.message);
    }
  };

  const handleDelete = async (songId) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => optimisticallyDeleteSong(prevSongs, songId));
      
      if (selectedSongs) {
        setSelectedSongs(prev => {
          const next = new Set(prev);
          next.delete(songId);
          return next;
        });
      }

      // Make API call
      await deleteSong(songId);
      
      onSuccess?.('Song deleted successfully');
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error deleting song:', e);
      onError?.(e.message);
    }
  };

  const handleBulkDelete = async (songIds) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => prevSongs.filter(song => !songIds.has(song._id)));
      
      // Delete songs one by one
      for (const songId of songIds) {
        await deleteSong(songId);
      }
      
      if (setSelectedSongs) {
        setSelectedSongs(new Set());
      }
      
      onSuccess?.('Songs deleted successfully');
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error deleting songs:', e);
      onError?.(e.message);
    }
  };

  return {
    handleEdit,
    handleDelete,
    handleBulkDelete
  };
} 