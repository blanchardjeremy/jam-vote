import { updateSong } from './songs';
import { apiRequest, optimisticUpdate, optimisticHelpers } from './apiHelpers';

// API calls for jam-song operations
export async function toggleSongPlayed(jamId, songId) {
  return apiRequest(`/api/jams/${jamId}/played`, {
    method: 'POST',
    body: JSON.stringify({ songId })
  });
}

export async function voteSong(jamId, songId, action) {
  return apiRequest(`/api/jams/${jamId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ songId, action })
  });
}

export async function removeSongFromJam(jamId, songId) {
  return apiRequest(`/api/jams/${jamId}`, {
    method: 'DELETE',
    body: JSON.stringify({ songId })
  });
}

export async function addSongToJam(jamId, songId) {
  return apiRequest(`/api/jams/${jamId}`, {
    method: 'PATCH',
    body: JSON.stringify({ songId })
  });
}

// Optimistic update helpers
export const optimisticallyTogglePlayed = (songs, songId) =>
  optimisticHelpers.toggle(songs, songId, 'played');

export const optimisticallyUpdateVote = (songs, songId, action) =>
  optimisticHelpers.increment(songs, songId, 'votes', action === 'vote' ? 1 : -1);

export const optimisticallyRemoveSong = optimisticHelpers.remove;

// Hook for components that need jam-song operations
export function useJamSongOperations({ 
  jamId,
  songs, 
  setSongs,
  sortMethod = 'votes'
}) {
  const handleTogglePlayed = async (songId) => {
    await optimisticUpdate({
      updateFn: prevSongs => optimisticallyTogglePlayed(prevSongs, songId),
      apiFn: () => toggleSongPlayed(jamId, songId),
      onSuccess: 'Song status updated',
      revertState: songs,
      setState: setSongs,
      logContext: 'updating played status'
    });
  };

  const handleVote = async (songId, action) => {
    await optimisticUpdate({
      updateFn: prevSongs => {
        const updatedSongs = optimisticallyUpdateVote(prevSongs, songId, action);
        if (sortMethod === 'votes') {
          updatedSongs.sort((a, b) => b.votes - a.votes);
        }
        return updatedSongs;
      },
      apiFn: () => voteSong(jamId, songId, action),
      revertState: songs,
      setState: setSongs,
      logContext: 'voting for song'
    });
  };

  const handleRemove = async (songId) => {
    await optimisticUpdate({
      updateFn: prevSongs => optimisticallyRemoveSong(prevSongs, songId),
      apiFn: () => removeSongFromJam(jamId, songId),
      onSuccess: 'Song removed from jam',
      revertState: songs,
      setState: setSongs,
      logContext: 'removing song from jam'
    });
  };

  const handleEdit = async (songId, updatedSong) => {
    await optimisticUpdate({
      updateFn: prevSongs => optimisticHelpers.updateNested(prevSongs, songId, 'song', updatedSong),
      apiFn: () => updateSong(songId, updatedSong),
      onSuccess: 'Song updated successfully',
      revertState: songs,
      setState: setSongs,
      logContext: 'updating song'
    });
  };

  return {
    handleTogglePlayed,
    handleVote,
    handleRemove,
    handleEdit
  };
} 