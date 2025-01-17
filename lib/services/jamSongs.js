import { updateSong } from './songs';
import { toast } from 'sonner';

// API calls for jam-song operations
export async function toggleSongPlayed(jamId, songId) {
  const res = await fetch(`/api/jams/${jamId}/played`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update played status');
  }

  return res.json();
}

export async function voteSong(jamId, songId, action) {
  const res = await fetch(`/api/jams/${jamId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId, action })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to vote for song');
  }

  return res.json();
}

export async function removeSongFromJam(jamId, songId) {
  const res = await fetch(`/api/jams/${jamId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to remove song from jam');
  }

  return res.json();
}

export async function addSongToJam(jamId, songId) {
  const res = await fetch(`/api/jams/${jamId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to add song to jam');
  }

  return res.json();
}

// Optimistic update helpers
export function optimisticallyTogglePlayed(songs, songId) {
  return songs.map(s => 
    s._id === songId ? { ...s, played: !s.played } : s
  );
}

export function optimisticallyUpdateVote(songs, songId, action) {
  return songs.map(s => 
    s._id === songId 
      ? { ...s, votes: action === 'vote' ? s.votes + 1 : s.votes - 1 }
      : s
  );
}

export function optimisticallyRemoveSong(songs, songId) {
  return songs.filter(s => s._id !== songId);
}

// Hook for components that need jam-song operations
export function useJamSongOperations({ 
  jamId,
  songs, 
  setSongs,
  sortMethod = 'votes'
}) {
  const handleTogglePlayed = async (songId) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => optimisticallyTogglePlayed(prevSongs, songId));

      // Make API call
      await toggleSongPlayed(jamId, songId);
      
      toast.success('Song status updated');
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error updating played status:', e);
      toast.error(e.message);
    }
  };

  const handleVote = async (songId, action) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => {
        const updatedSongs = optimisticallyUpdateVote(prevSongs, songId, action);
        // Only sort if we're using vote-based sorting
        if (sortMethod === 'votes') {
          updatedSongs.sort((a, b) => b.votes - a.votes);
        }
        return updatedSongs;
      });

      // Make API call
      await voteSong(jamId, songId, action);
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error voting for song:', e);
      toast.error(e.message);
    }
  };

  const handleRemove = async (songId) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => optimisticallyRemoveSong(prevSongs, songId));

      // Make API call
      await removeSongFromJam(jamId, songId);
      
      toast.success('Song removed from jam');
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error removing song:', e);
      toast.error(e.message);
    }
  };

  const handleEdit = async (songId, updatedSong) => {
    try {
      // Optimistically update UI
      setSongs(prevSongs => 
        prevSongs.map(s => 
          s._id === songId 
            ? { ...s, song: { ...s.song, ...updatedSong } }
            : s
        )
      );

      // Make API call
      await updateSong(songId, updatedSong);
      
      toast.success('Song updated successfully');
    } catch (e) {
      // Revert optimistic update on error
      setSongs(songs);
      console.error('Error updating song:', e);
      toast.error(e.message);
    }
  };

  return {
    handleTogglePlayed,
    handleVote,
    handleRemove,
    handleEdit
  };
} 