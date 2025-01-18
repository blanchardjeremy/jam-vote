import { updateSong } from './songs';
import { apiRequest, optimisticUpdate, optimisticHelpers } from './apiHelpers';
import { addSongsToJam as addSongsToJamService } from './jams';

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
  return apiRequest(`/api/jams/${jamId}/songs`, {
    method: 'DELETE',
    body: JSON.stringify({ songId })
  });
}

export async function addSongToJam(jamId, songId) {
  // Add the song to the jam
  const result = await addSongsToJamService(jamId, [songId]);
  
  if (result.jam.songs.length > 0) {
    const newSong = result.jam.songs[result.jam.songs.length - 1];
    
    // Optimistically update the vote count
    result.jam.songs[result.jam.songs.length - 1].votes = 1;
    
    // Store the vote in localStorage
    localStorage.setItem(`vote-${newSong._id}`, 'true');
    
    // Fire off the vote API call in the background
    voteSong(jamId, newSong._id, 'vote').catch(console.error);
  }
  
  return result;
}

// Optimistic update helpers
export const optimisticallyTogglePlayed = (songs, songId) => {
  if (!Array.isArray(songs)) return songs;
  return songs.map(s => s._id === songId ? { ...s, played: !s.played } : s);
};

export const optimisticallyUpdateVote = (songs, songId, action) => {
  if (!Array.isArray(songs)) return songs;
  return songs.map(s => s._id === songId ? { ...s, votes: s.votes + (action === 'vote' ? 1 : -1) } : s);
};

export const optimisticallyRemoveSong = (songs, songId) => {
  if (!Array.isArray(songs)) return songs;
  return songs.filter(s => s.song._id.toString() !== songId.toString());
};

// Helper function to handle position-based highlights
export const handlePositionHighlight = (songs, songId, oldPosition, newPosition, setState, clearHighlightAfterDelay) => {
  if (newPosition !== oldPosition) {
    const isUpward = newPosition < oldPosition;
    const highlightType = isUpward ? 'warning' : 'error';
    
    // Create a new array with the highlight
    const updatedSongs = [...songs];
    updatedSongs[newPosition] = {
      ...updatedSongs[newPosition],
      highlight: highlightType
    };
    
    // Schedule highlight removal
    if (clearHighlightAfterDelay) {
      clearHighlightAfterDelay(songId);
    }
    
    return updatedSongs;
  }
  return songs;
};

// Hook for components that need jam-song operations
export function useJamSongOperations({ 
  jamId,
  songs, 
  setSongs,
  sortMethod = 'votes',
  clearHighlightAfterDelay
}) {
  const handleTogglePlayed = async (songId) => {
    await optimisticUpdate({
      updateFn: prevSongs => optimisticallyTogglePlayed(prevSongs, songId),
      apiFn: () => toggleSongPlayed(jamId, songId),
      revertState: songs,
      setState: setSongs,
      logContext: 'updating played status'
    });
  };

  const handleVote = async (songId, action) => {
    await optimisticUpdate({
      updateFn: prevSongs => {
        // Get current position before vote
        const oldPosition = prevSongs.findIndex(s => s._id === songId);
        
        // Update votes optimistically
        let updatedSongs = prevSongs.map(s => 
          s._id === songId 
            ? { ...s, votes: s.votes + (action === 'vote' ? 1 : -1) }
            : s
        );
        
        // Sort if needed
        if (sortMethod === 'votes') {
          updatedSongs.sort((a, b) => b.votes - a.votes);
          const newPosition = updatedSongs.findIndex(s => s._id === songId);
          updatedSongs = handlePositionHighlight(updatedSongs, songId, oldPosition, newPosition, setSongs, clearHighlightAfterDelay);
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
      updateFn: prevSongs => prevSongs.map(s => 
        s._id === songId ? { ...s, song: { ...s.song, ...updatedSong } } : s
      ),
      apiFn: () => {
        const songToUpdate = songs.find(s => s._id === songId);
        return updateSong(songToUpdate.song._id, updatedSong);
      },
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