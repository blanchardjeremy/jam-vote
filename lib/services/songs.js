import { apiRequest, optimisticUpdate, optimisticHelpers } from './apiHelpers';

// API calls for song operations
export async function createSong(songData) {
  return apiRequest('/api/songs', {
    method: 'POST',
    body: JSON.stringify(songData)
  });
}

export async function createSongsBulk(songs) {
  const results = [];
  const errors = [];

  for (const songData of songs) {
    try {
      const result = await createSong(songData);
      results.push(result);
    } catch (error) {
      errors.push({ song: songData, error: error.message });
    }
  }

  return { results, errors };
}

export async function updateSong(songId, updatedSong) {
  return apiRequest(`/api/songs/${songId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedSong)
  });
}

export async function deleteSong(songId) {
  return apiRequest(`/api/songs/${songId}`, {
    method: 'DELETE'
  });
}

export async function fetchSongs() {
  return apiRequest('/api/songs');
}

// Optimistic update helpers
export const optimisticallyUpdateSong = optimisticHelpers.update;
export const optimisticallyDeleteSong = optimisticHelpers.remove;

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
    await optimisticUpdate({
      updateFn: prevSongs => optimisticallyUpdateSong(prevSongs, songId, updatedSong),
      apiFn: () => updateSong(songId, updatedSong),
      onSuccess: onSuccess || 'Song updated successfully',
      onError,
      revertState: songs,
      setState: setSongs,
      logContext: 'updating song'
    });
  };

  const handleDelete = async (songId) => {
    await optimisticUpdate({
      updateFn: prevSongs => {
        const updatedSongs = optimisticallyDeleteSong(prevSongs, songId);
        if (selectedSongs) {
          setSelectedSongs(prev => {
            const next = new Set(prev);
            next.delete(songId);
            return next;
          });
        }
        return updatedSongs;
      },
      apiFn: () => deleteSong(songId),
      onSuccess: onSuccess || 'Song deleted successfully',
      onError,
      revertState: songs,
      setState: setSongs,
      logContext: 'deleting song'
    });
  };

  const handleBulkDelete = async (songIds) => {
    await optimisticUpdate({
      updateFn: prevSongs => prevSongs.filter(song => !songIds.has(song._id)),
      apiFn: async () => {
        for (const songId of songIds) {
          await deleteSong(songId);
        }
      },
      onSuccess: onSuccess || 'Songs deleted successfully',
      onError,
      revertState: songs,
      setState: setSongs,
      logContext: 'bulk deleting songs'
    });

    if (setSelectedSongs) {
      setSelectedSongs(new Set());
    }
  };

  return {
    handleEdit,
    handleDelete,
    handleBulkDelete
  };
}

// Search functionality
export async function searchSongs(query) {
  if (!query || query.length < 3) return [];
  return apiRequest(`/api/songs/search?q=${encodeURIComponent(query)}`);
} 