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

export async function voteSong(jamId, songId, action, silent = false) {
  return apiRequest(`/api/jams/${jamId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ songId, action, silent })
  });
}

export async function removeSongFromJam(jamId, songId) {
  return apiRequest(`/api/jams/${jamId}/songs`, {
    method: 'DELETE',
    body: JSON.stringify({ songId })
  });
}

export async function addSongToJam(jamId, songId) {
  console.log('[Debug addSongToJam] Starting with params:', { jamId, songId });
  
  if (!songId) {
    console.error('[Debug addSongToJam] Invalid songId:', songId);
    throw new Error('Invalid songId provided');
  }

  const requestBody = { songId };
  console.log('[Debug addSongToJam] Making request with body:', requestBody);
  
  const result = await apiRequest(`/api/jams/${jamId}`, {
    method: 'PATCH',
    body: JSON.stringify(requestBody)
  });
  console.log('[Debug addSongToJam] Service result:', result);
  
  return result;
}

// Optimistic update helpers
export const optimisticallyTogglePlayed = (songs, songId) => {
  if (!Array.isArray(songs)) return songs;
  return songs.map(s => s._id === songId ? { 
    ...s, 
    played: !s.played,
    // Set or clear playedAt timestamp based on played status
    playedAt: !s.played ? new Date().toISOString() : null
  } : s);
};

export const optimisticallyUpdateVote = (songs, songId, action) => {
  if (!Array.isArray(songs)) return songs;
  
  // Only show rainbow heart for upvotes
  if (action === 'vote') {
    // Clear the rainbow heart after 10 seconds
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('clearRainbowHeart', { detail: { songId } });
        window.dispatchEvent(event);
      }
    }, 10000);
  }
  
  return songs.map(s => s._id === songId ? { 
    ...s, 
    votes: s.votes + (action === 'vote' ? 1 : -1),
    showRainbowHeart: action === 'vote'
  } : s);
};

export const optimisticallyRemoveSong = (songs, songId) => {
  if (!Array.isArray(songs)) return songs;
  return songs.filter(s => s.song._id.toString() !== songId.toString());
};

// Helper function to handle position-based highlights
export const handlePositionHighlight = (songs, songId, oldPosition, newPosition, setState, clearHighlightAfterDelay) => {
  console.log('[Highlight Debug] Checking positions:', {
    songId,
    oldPosition,
    newPosition,
    shouldHighlight: newPosition !== oldPosition
  });

  // Strict position change check
  if (typeof oldPosition !== 'number' || typeof newPosition !== 'number') {
    console.log('[Highlight Debug] Invalid positions:', { oldPosition, newPosition });
    return songs;
  }

  if (oldPosition === newPosition) {
    console.log('[Highlight Debug] No position change:', { oldPosition, newPosition });
    return songs;
  }

  // Only highlight if it's moving up (since this is the song being voted on)
  // Songs moving down are just side effects and shouldn't be highlighted
  if (newPosition < oldPosition) {
    const highlightType = 'success';  // green for upward movement
    
    console.log('[Highlight Debug] Applying highlight:', {
      songId,
      highlightType,
      direction: 'upward'
    });
    
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

  // If it's moving down, don't highlight it
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
        console.log('[Vote Debug] Pre-sort state:', {
          songId,
          oldPosition,
          currentVotes: prevSongs[oldPosition]?.votes,
          neighborVotes: {
            prev: oldPosition > 0 ? prevSongs[oldPosition - 1]?.votes : 'none',
            next: oldPosition < prevSongs.length - 1 ? prevSongs[oldPosition + 1]?.votes : 'none'
          }
        });
        
        // Update votes optimistically
        let updatedSongs = prevSongs.map(s => 
          s._id === songId 
            ? { ...s, votes: s.votes + (action === 'vote' ? 1 : -1) }
            : s
        );
        
        // Sort if needed
        if (sortMethod === 'votes') {
          console.log('[Vote Debug] Pre-sort votes:', updatedSongs.map(s => ({ id: s._id, votes: s.votes })));
          updatedSongs.sort((a, b) => b.votes - a.votes);
          console.log('[Vote Debug] Post-sort votes:', updatedSongs.map(s => ({ id: s._id, votes: s.votes })));
          
          const newPosition = updatedSongs.findIndex(s => s._id === songId);
          console.log('[Vote Debug] Position check:', {
            oldPosition,
            newPosition,
            shouldHighlight: oldPosition !== newPosition,
            updatedVotes: updatedSongs[newPosition]?.votes
          });
          
          // Only apply highlight if position actually changed
          if (oldPosition !== newPosition) {
            console.log('[Vote Debug] Applying highlight:', {
              songId,
              type: newPosition < oldPosition ? 'warning' : 'error'
            });
            updatedSongs = handlePositionHighlight(updatedSongs, songId, oldPosition, newPosition, setSongs, clearHighlightAfterDelay);
          }
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
      // onSuccess: 'Song removed from jam',
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