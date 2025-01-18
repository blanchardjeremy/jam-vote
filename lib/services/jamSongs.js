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
  return apiRequest(`/api/jams/${jamId}`, {
    method: 'DELETE',
    body: JSON.stringify({ songId })
  });
}

export async function addSongToJam(jamId, songId) {
  return addSongsToJamService(jamId, [songId]);
}

// Optimistic update helpers
export const optimisticallyTogglePlayed = (songs, songId) => {
  console.log('[Optimistic Toggle] Input songs:', songs);
  console.log('[Optimistic Toggle] Songs type:', typeof songs, Array.isArray(songs));
  if (!Array.isArray(songs)) return songs;
  return songs.map(s => s._id === songId ? { ...s, played: !s.played } : s);
};

export const optimisticallyUpdateVote = (songs, songId, action) => {
  console.log('[Optimistic Vote] Input songs:', songs);
  console.log('[Optimistic Vote] Songs type:', typeof songs, Array.isArray(songs));
  if (!Array.isArray(songs)) return songs;
  return songs.map(s => s._id === songId ? { ...s, votes: s.votes + (action === 'vote' ? 1 : -1) } : s);
};

export const optimisticallyRemoveSong = (songs, songId) => {
  console.log('[Optimistic Remove] Input songs:', songs);
  console.log('[Optimistic Remove] Songs type:', typeof songs, Array.isArray(songs));
  if (!Array.isArray(songs)) return songs;
  return songs.filter(s => s._id !== songId);
};

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
      revertState: songs,
      setState: setSongs,
      logContext: 'updating played status'
    });
  };

  const handleVote = async (songId, action) => {
    console.log('[Handle Vote] Current songs:', songs);
    console.log('[Handle Vote] Songs type:', typeof songs, Array.isArray(songs));
    
    await optimisticUpdate({
      updateFn: prevSongs => {
        console.log('[Handle Vote] Previous songs in updateFn:', prevSongs);
        console.log('[Handle Vote] Previous songs type:', typeof prevSongs, Array.isArray(prevSongs));
        
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
      updateFn: prevSongs => prevSongs.map(s => 
        s._id === songId ? { ...s, song: { ...s.song, ...updatedSong } } : s
      ),
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