import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchSongs } from '@/lib/services/songs';
import { useJamOperations } from '@/lib/services/jams';
import { useJamSongOperations, addSongToJam, voteSong } from '@/lib/services/jamSongs';

export function useJamPage(slug) {
  const router = useRouter();
  const [jam, setJam] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState(true);
  const [sortMethod, setSortMethod] = useState('votes');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [songToDelete, setSongToDelete] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [lastAddedSongId, setLastAddedSongId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const songAutocompleteRef = useRef(null);
  const highlightTimeouts = useRef({});

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(highlightTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const clearHighlightAfterDelay = (songId) => {
    if (highlightTimeouts.current[songId]) {
      clearTimeout(highlightTimeouts.current[songId]);
    }

    highlightTimeouts.current[songId] = setTimeout(() => {
      setJam(prev => ({
        ...prev,
        songs: prev.songs.map(s => 
          s._id === songId 
            ? { ...s, highlight: null }
            : s
        )
      }));
      delete highlightTimeouts.current[songId];
    }, 15000);
  };

  const { handleEdit, handleRemove, handleVote, handleTogglePlayed } = useJamSongOperations({
    jamId: jam?._id,
    songs: jam?.songs || [],
    setSongs: (newSongs) => {
      if (typeof newSongs === 'function') {
        setJam(prev => ({
          ...prev,
          songs: newSongs(prev.songs)
        }));
      } else {
        setJam(prev => ({
          ...prev,
          songs: newSongs
        }));
      }
    },
    sortMethod,
    clearHighlightAfterDelay
  });

  const { handleDelete: handleDeleteJam } = useJamOperations({
    jams: [jam],
    setJams: (updatedJams) => {
      if (typeof updatedJams === 'function') {
        const newJams = updatedJams([jam]);
        setJam(newJams[0]);
      } else {
        setJam(updatedJams[0]);
      }
    },
    onSuccess: () => {
      router.push('/');
    },
    onError: (error) => {
      setError(error);
      console.error('Error deleting jam:', error);
    }
  });

  const fetchJam = async () => {
    try {
      const res = await fetch(`/api/jams/by-slug/${slug}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch jam');
      }
      const data = await res.json();
      return data;
    } catch (e) {
      setError(e.message);
      console.error('Error in JamPage component:', e);
      throw e;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const [jamData, songsData] = await Promise.all([
          fetchJam(),
          fetchSongs()
        ]);
        setJam(jamData);
        setAllSongs(songsData);
      } catch (e) {
        console.error('Error initializing:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [slug]);

  const handleAddSongToJam = async (songId) => {
    try {
      console.log('[Debug] Adding song to jam:', { jamId: jam._id, songId });
      const { jam: updatedJam } = await addSongToJam(jam._id, songId);
      
      // Get the new song
      const newJamSong = updatedJam.songs[updatedJam.songs.length - 1];
      if (newJamSong) {
        // Store vote in localStorage first
        localStorage.setItem(`vote-${newJamSong._id}`, 'true');
        
        // Update the jam state optimistically with the vote
        setJam(prev => ({
          ...prev,
          songs: prev.songs.map(s => 
            s._id === newJamSong._id 
              ? { ...s, votes: s.votes + 1 }
              : s
          )
        }));
        
        // Set the last added song for UI feedback
        setLastAddedSongId(newJamSong._id);
        setTimeout(() => {
          setLastAddedSongId(null);
        }, 15000);
        
        // Fire off the vote API call in the background with silent flag
        voteSong(jam._id, newJamSong._id, 'vote', true).catch(error => {
          console.error('[Debug] Error voting for new song:', error);
          // If the vote fails, revert the optimistic update
          localStorage.removeItem(`vote-${newJamSong._id}`);
          setJam(updatedJam);
        });
      }

      return updatedJam;
    } catch (e) {
      console.error('[Debug] Error adding song:', e);
      toast.error(e.message || 'Failed to add song to jam');
      throw e;
    }
  };

  const handleSelectExisting = async (song) => {
    try {
      if (!song || !song.value) {
        console.error('[Debug] Invalid song object:', song);
        toast.error('Invalid song selection');
        return;
      }
      await handleAddSongToJam(song.value);
    } catch (e) {
      toast.error('Failed to add song');
    }
  };

  const handleAddNew = (title) => {
    setNewSongTitle(title);
    setIsAddModalOpen(true);
  };

  const handleAddSong = async (newSong) => {
    try {
      // If no song provided, close modal and return
      if (!newSong || !newSong._id) {
        console.log('[Debug] No valid song provided to handleAddSong');
        setIsAddModalOpen(false);
        return;
      }

      // Check for duplicates
      if (jam.songs.some(existingSong => existingSong.song._id === newSong._id)) {
        console.log('[Debug] Song already exists in jam:', newSong._id);
        toast.error('Song already exists in this jam');
        setIsAddModalOpen(false);
        return;
      }

      console.log('[Debug] Adding song to jam:', newSong._id);
      await handleAddSongToJam(newSong._id);
      setIsAddModalOpen(false);
    } catch (e) {
      console.error('[Debug] Error in handleAddSong:', e);
      toast.error('Failed to add song');
    }
  };

  // Handle modal close, which might include a selected song
  const handleModalClose = (selectedSong) => {
    if (selectedSong?._id) {
      console.log('[Debug] Selected song from modal:', selectedSong);
      handleAddSong(selectedSong);
    }
    setIsAddModalOpen(false);
  };

  return {
    jam,
    setJam,
    error,
    isLoading,
    isAddModalOpen,
    setIsAddModalOpen: handleModalClose, // Replace direct setter with handler
    groupingEnabled,
    setGroupingEnabled,
    sortMethod,
    setSortMethod,
    newSongTitle,
    songToDelete,
    setSongToDelete,
    isRemoving,
    setIsRemoving,
    lastAddedSongId,
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    setIsDeleting,
    songAutocompleteRef,
    handleEdit,
    handleRemove,
    handleVote,
    handleTogglePlayed,
    handleDeleteJam,
    handleSelectExisting,
    handleAddNew,
    handleAddSong,
    clearHighlightAfterDelay
  };
} 