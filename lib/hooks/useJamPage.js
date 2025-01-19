import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchSongs } from '@/lib/services/songs';
import { useJamOperations } from '@/lib/services/jams';
import { useJamSongOperations, addSongToJam } from '@/lib/services/jamSongs';

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
      
      setJam(updatedJam);
      
      const newJamSong = updatedJam.songs[updatedJam.songs.length - 1];
      if (newJamSong) {
        localStorage.setItem(`vote-${newJamSong._id}`, 'true');
        setLastAddedSongId(newJamSong._id);
        
        setTimeout(() => {
          setLastAddedSongId(null);
        }, 15000);
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
      if (jam.songs.some(existingSong => existingSong.song._id === newSong._id)) {
        setIsAddModalOpen(false);
        return;
      }

      await handleAddSongToJam(newSong._id);
      setIsAddModalOpen(false);
    } catch (e) {
      toast.error('Failed to add song');
    }
  };

  return {
    jam,
    setJam,
    error,
    isLoading,
    isAddModalOpen,
    setIsAddModalOpen,
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