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
  // First add the song to the jam
  const result = await addSongsToJamService(jamId, [songId]);
  
  // Then automatically vote for it
  if (result.jam.songs.length > 0) {
    const newSong = result.jam.songs[result.jam.songs.length - 1];
    await voteSong(jamId, newSong._id, 'vote');
    
    // Update the song's vote count in the result
    result.jam.songs[result.jam.songs.length - 1].votes = 1;
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