import { updateSong } from './songs';
import { apiRequest, optimisticUpdate, optimisticHelpers } from './apiHelpers';
import { addSongsToJam as addSongsToJamService } from './jams';
import { compareByVotes } from '@/lib/utils/songOrder';

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

export async function knowSong(jamId, songId, action) {
  return apiRequest(`/api/jams/${jamId}/know`, {
    method: 'POST',
    body: JSON.stringify({ songId, action })
  });
}

// A heart ("I love it") also counts as "I know it" — once per person.
// If this device hasn't marked the song as known yet, mark it and add a know.
// Returns true when a know was added. Un-hearting leaves the know in place.
// If this device had said "I don't know it", that answer is taken back
// (through `removeDontKnow`, when given) so the person isn't counted twice.
export function alsoMarkKnownForLove(jamSongId, addKnow, removeDontKnow) {
  try {
    if (removeDontKnow && localStorage.getItem(`dontknow-${jamSongId}`) === 'true') {
      localStorage.removeItem(`dontknow-${jamSongId}`);
      Promise.resolve(removeDontKnow(jamSongId)).catch(() => {});
    }
    if (localStorage.getItem(`know-${jamSongId}`) === 'true') return false;
    localStorage.setItem(`know-${jamSongId}`, 'true');
  } catch {
    return false;
  }
  Promise.resolve(addKnow(jamSongId)).catch(() => {});
  return true;
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
//
// Each handler reverts only its own change on failure, using a functional
// update against the latest state. Reverting to a snapshot of the whole list
// would wipe out any optimistic or live updates that landed in the meantime.
export function useJamSongOperations({ 
  jamId,
  songs, 
  setSongs,
  sortMethod = 'votes',
  clearHighlightAfterDelay
}) {
  const handleTogglePlayed = async (songId) => {
    let before = null;
    let after = null;
    await optimisticUpdate({
      updateFn: prevSongs => {
        const updatedSongs = optimisticallyTogglePlayed(prevSongs, songId);
        const prevSong = prevSongs.find(s => s._id === songId);
        const nextSong = updatedSongs.find(s => s._id === songId);
        if (prevSong && nextSong) {
          before = { played: prevSong.played, playedAt: prevSong.playedAt };
          after = { played: nextSong.played };
        }
        return updatedSongs;
      },
      apiFn: () => toggleSongPlayed(jamId, songId),
      // Undo only if the song still shows our optimistic value
      revertState: prevSongs => !before ? prevSongs : prevSongs.map(s =>
        s._id === songId && s.played === after.played ? { ...s, ...before } : s
      ),
      setState: setSongs,
      logContext: 'updating played status'
    });
  };

  const handleVote = async (songId, action) => {
    const delta = action === 'vote' ? 1 : -1;
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
            ? { ...s, votes: s.votes + delta }
            : s
        );
        
        // Sort if needed
        if (sortMethod === 'votes') {
          console.log('[Vote Debug] Pre-sort votes:', updatedSongs.map(s => ({ id: s._id, votes: s.votes })));
          updatedSongs.sort(compareByVotes);
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
      // Reverse this vote's delta on the one song
      revertState: prevSongs => {
        const revertedSongs = prevSongs.map(s =>
          s._id === songId ? { ...s, votes: s.votes - delta, highlight: null } : s
        );
        if (sortMethod === 'votes') {
          revertedSongs.sort(compareByVotes);
        }
        return revertedSongs;
      },
      setState: setSongs,
      logContext: 'voting for song'
    });
  };

  // action: 'know' | 'unknow' | 'dontknow' | 'undontknow'
  const handleKnow = async (songId, action) => {
    const field = action.endsWith('dontknow') ? 'dontKnows' : 'knows';
    const step = action.startsWith('un') ? -1 : 1;
    // The count is clamped at 0, so remember how much it actually moved
    let appliedDelta = 0;
    await optimisticUpdate({
      updateFn: prevSongs => {
        const updatedSongs = prevSongs.map(s => {
          if (s._id !== songId) return s;
          const value = Math.max(0, (s[field] || 0) + step);
          appliedDelta = value - (s[field] || 0);
          return { ...s, [field]: value };
        });
        return sortMethod === 'votes' ? updatedSongs.sort(compareByVotes) : updatedSongs;
      },
      apiFn: () => knowSong(jamId, songId, action),
      // Reverse this change's delta on the one song
      revertState: prevSongs => {
        if (!appliedDelta) return prevSongs;
        const revertedSongs = prevSongs.map(s =>
          s._id === songId ? { ...s, [field]: Math.max(0, (s[field] || 0) - appliedDelta) } : s
        );
        return sortMethod === 'votes' ? revertedSongs.sort(compareByVotes) : revertedSongs;
      },
      setState: setSongs,
      logContext: field === 'knows' ? 'marking song as known' : 'marking song as not known'
    });
  };

  const handleRemove = async (songId) => {
    let removedSong = null;
    let removedIndex = -1;
    await optimisticUpdate({
      updateFn: prevSongs => {
        removedIndex = prevSongs.findIndex(s => s.song._id.toString() === songId.toString());
        removedSong = removedIndex >= 0 ? prevSongs[removedIndex] : null;
        return optimisticallyRemoveSong(prevSongs, songId);
      },
      apiFn: () => removeSongFromJam(jamId, songId),
      // onSuccess: 'Song removed from jam',
      // Put the removed song back where it was, unless it is already there
      revertState: prevSongs => {
        if (!removedSong || prevSongs.some(s => s._id === removedSong._id)) {
          return prevSongs;
        }
        const revertedSongs = [...prevSongs];
        revertedSongs.splice(Math.min(removedIndex, revertedSongs.length), 0, removedSong);
        return revertedSongs;
      },
      setState: setSongs,
      logContext: 'removing song from jam'
    });
  };

  const handleEdit = async (songId, updatedSong) => {
    let previousSong = null;
    await optimisticUpdate({
      updateFn: prevSongs => prevSongs.map(s => {
        if (s._id !== songId) return s;
        previousSong = s.song;
        return { ...s, song: { ...s.song, ...updatedSong } };
      }),
      apiFn: () => {
        const songToUpdate = songs.find(s => s._id === songId);
        return updateSong(songToUpdate.song._id, updatedSong);
      },
      onSuccess: 'Song updated successfully',
      // Restore only this song's details
      revertState: prevSongs => !previousSong ? prevSongs : prevSongs.map(s =>
        s._id === songId ? { ...s, song: previousSong } : s
      ),
      setState: setSongs,
      logContext: 'updating song'
    });
  };

  return {
    handleTogglePlayed,
    handleVote,
    handleKnow,
    handleRemove,
    handleEdit
  };
}
