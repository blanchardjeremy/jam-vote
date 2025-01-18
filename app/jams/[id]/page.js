'use client';

import { useState, useEffect, useRef } from 'react';
import SongAutocomplete from "@/components/SongAutocomplete";
import CreateSongModal from "@/components/CreateSongModal";
import { useParams } from 'next/navigation';
import SongRow from "@/components/SongRowJam";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle, 
} from "@/components/ui/alert-dialog";
import { pusherClient } from "@/lib/pusher";
import { SelectSeparator } from '@/components/ui/select';
import { FireIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import LoadingBlock from "@/components/LoadingBlock";
import { toast } from 'sonner';
import { useJamSongOperations, addSongToJam } from '@/lib/services/jamSongs';
import { fetchSongs } from '@/lib/services/songs';
import ConfirmDialog from '@/components/ConfirmDialog';

// Helper component for rendering song lists
function SongList({ songs, nextSongId, onVote, onRemove, onTogglePlayed, onEdit, hideTypeBadge, emptyMessage, groupingEnabled, lastAddedSongId }) {
  console.log('[SongList] Rendering with props:', {
    songsCount: songs?.length,
    lastAddedSongId,
    songIds: songs?.map(s => s._id)
  });

  if (songs.length === 0) {
    return (
      <li className="px-4 py-3 text-sm text-gray-500 italic">
        {emptyMessage}
      </li>
    );
  }

  return songs.map((jamSong, index) => {
    const willHighlight = jamSong._id === lastAddedSongId;
    console.log('[SongList] Rendering song:', {
      songId: jamSong._id,
      songDbId: jamSong.song._id,
      lastAddedSongId,
      willHighlight,
      songTitle: jamSong.song.title
    });
    
    return (
      <li key={`${jamSong.song._id}-${index}`} className="hover:bg-gray-50">
        <SongRow 
          jamSong={jamSong} 
          onVote={onVote} 
          onRemove={() => onRemove(jamSong)}
          onTogglePlayed={onTogglePlayed}
          onEdit={onEdit}
          isNext={jamSong._id === nextSongId}
          hideType={hideTypeBadge}
          groupingEnabled={groupingEnabled}
          highlight={willHighlight ? 'rgba(59, 130, 246, 0.2)' : null}
        />
      </li>
    );
  });
}

export default function JamPage() {
  const params = useParams();
  const [jam, setJam] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState(true);
  const [sortMethod, setSortMethod] = useState('votes');
  const songAutocompleteRef = useRef(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [songToDelete, setSongToDelete] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [lastAddedSongId, setLastAddedSongId] = useState(null);

  // Get jam song operations from our service
  const { handleEdit, handleRemove, handleVote, handleTogglePlayed } = useJamSongOperations({
    jamId: params.id,
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
    sortMethod
  });

  // Helper function to add a song to the jam
  const handleAddSongToJam = async (songId) => {
    try {
      console.log('[JamPage] handleAddSongToJam called with songId:', songId);
      const { jam: updatedJam } = await addSongToJam(params.id, songId);
      console.log('[JamPage] Got response from addSongToJam:', { updatedJam });
      
      // Update local state immediately
      setJam(updatedJam);
      
      // Find the newly added song (it will be the last one in the array)
      const newJamSong = updatedJam.songs[updatedJam.songs.length - 1];
      if (newJamSong) {
        console.log('[JamPage] Setting lastAddedSongId:', newJamSong._id);
        localStorage.setItem(`vote-${newJamSong._id}`, 'true');
        // Set the last added song ID to trigger highlight
        setLastAddedSongId(newJamSong._id);
        
        // Log the current state after setting
        console.log('[JamPage] Current jam songs:', updatedJam.songs);
        console.log('[JamPage] Added song ID:', newJamSong._id);
        
        // Clear the highlight after 3 seconds (matching animation duration)
        setTimeout(() => {
          console.log('[JamPage] Clearing lastAddedSongId');
          setLastAddedSongId(null);
        }, 3000);
      }

      return updatedJam;
    } catch (e) {
      console.error('[JamPage] Error in handleAddSongToJam:', e);
      toast.error(e.message || 'Failed to add song to jam');
      throw e;
    }
  };

  const handleSelectExisting = async (song) => {
    try {
      console.log('[JamPage] handleSelectExisting called with song:', song);
      await handleAddSongToJam(song.value);
      console.log('[JamPage] Song added successfully');
    } catch (e) {
      console.error('[JamPage] Error adding song to jam:', e);
      toast.error('Failed to add song');
    }
  };

  const handleAddNew = (title) => {
    console.log('[JamPage] handleAddNew called with title:', title);
    setNewSongTitle(title);
    setIsAddModalOpen(true);
  };

  const handleAddSong = async (newSong) => {
    try {
      console.log('[JamPage] handleAddSong called with newSong:', newSong);
      // Check if song already exists in the jam
      if (jam.songs.some(existingSong => existingSong.song._id === newSong._id)) {
        console.log('[JamPage] Song already exists in jam');
        setIsAddModalOpen(false);
        return;
      }

      await handleAddSongToJam(newSong._id);
      console.log('[JamPage] New song added successfully');
      setIsAddModalOpen(false);
    } catch (e) {
      console.error('[JamPage] Error adding new song to jam:', e);
      toast.error('Failed to add song');
    }
  };

  // Function to group songs
  const getGroupedSongs = (songs) => {
    if (!Array.isArray(songs)) {
      console.warn('getGroupedSongs received non-array songs:', songs);
      return {
        bangers: [],
        ballads: [],
        ungrouped: [],
        nextSongId: null
      };
    }

    // Helper function to sort within groups
    const sortWithinGroup = (songs) => {
      return [...songs].sort((a, b) => {
        if (sortMethod === 'votes') {
          return b.votes - a.votes;
        }
        return a.order - b.order;
      });
    };

    // First split into played and unplayed
    const playedSongs = songs.filter(song => song.played);
    const unplayedSongs = songs.filter(song => !song.played);

    if (!groupingEnabled) {
      // Even in ungrouped view, we still want played songs at the top
      const sortedPlayed = sortWithinGroup(playedSongs);
      const sortedUnplayed = sortWithinGroup(unplayedSongs);
      
      // Find next unplayed song
      const nextSongId = sortedUnplayed[0]?._id;
      
      return { 
        ungrouped: [...sortedPlayed, ...sortedUnplayed],
        nextSongId 
      };
    }

    // For grouped view, split each played status group into bangers and ballads
    const playedBangers = sortWithinGroup(playedSongs.filter(song => song.song.type === 'banger'));
    const playedBallads = sortWithinGroup(playedSongs.filter(song => song.song.type === 'ballad'));
    const unplayedBangers = sortWithinGroup(unplayedSongs.filter(song => song.song.type === 'banger'));
    const unplayedBallads = sortWithinGroup(unplayedSongs.filter(song => song.song.type === 'ballad'));

    // Find next unplayed song - first check bangers, then ballads
    const nextSongId = unplayedBangers[0]?._id || unplayedBallads[0]?._id;

    return {
      bangers: [...playedBangers, ...unplayedBangers],
      ballads: [...playedBallads, ...unplayedBallads],
      nextSongId
    };
  };

  const fetchJam = async () => {
    try {
      const res = await fetch(`/api/jams/${params.id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch jam');
      }
      const data = await res.json();
      console.log('[Jam Page] Fetched jam data:', data);
      console.log('[Jam Page] Songs type:', typeof data?.songs, Array.isArray(data?.songs));
      setJam(data);
    } catch (e) {
      setError(e.message);
      console.error('Error in JamPage component:', e);
    } finally {
      setIsLoading(false);
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
        setAllSongs(songsData);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [params.id]);

  // Set up Pusher connection in a separate useEffect
  useEffect(() => {
    console.log('[Pusher Client] Setting up connection');
    const channelName = `jam-${params.id}`;
    const channel = pusherClient.subscribe(channelName);
    
    // Clean up any existing bindings first
    channel.unbind_all();

    // Handle vote updates
    channel.bind('vote', (data) => {
      console.log('[Pusher Client] Received vote event:', data);
      setJam(prevJam => {
        console.log('[Pusher Client] Previous jam state:', prevJam);
        console.log('[Pusher Client] Songs type:', typeof prevJam?.songs, Array.isArray(prevJam?.songs));
        
        if (!prevJam?.songs) {
          console.log('[Pusher Client] No previous jam state or songs, skipping vote update');
          return prevJam;
        }

        if (!Array.isArray(prevJam.songs)) {
          console.log('[Pusher Client] Songs is not an array, attempting to fix:', prevJam.songs);
          // If songs is not an array but is an object with numeric keys, convert it
          if (typeof prevJam.songs === 'object') {
            const songsArray = Object.values(prevJam.songs);
            if (Array.isArray(songsArray)) {
              prevJam = { ...prevJam, songs: songsArray };
            }
          }
          // If we still don't have an array, return unchanged
          if (!Array.isArray(prevJam.songs)) {
            return prevJam;
          }
        }
        
        // Only update if the vote count is different to avoid unnecessary re-renders
        const songToUpdate = prevJam.songs.find(s => s._id.toString() === data.songId);
        console.log('[Pusher Client] Found song to update:', songToUpdate);
        
        if (!songToUpdate || songToUpdate.votes === data.votes) {
          return prevJam;
        }
        
        const updatedSongs = prevJam.songs.map(s => 
          s._id.toString() === data.songId ? { ...s, votes: data.votes } : s
        );
        
        // Only sort if we're using vote-based sorting
        if (sortMethod === 'votes') {
          updatedSongs.sort((a, b) => b.votes - a.votes);
        }
        
        return {
          ...prevJam,
          songs: updatedSongs
        };
      });
    });

    // Handle captain updates
    channel.bind('captain-added', (data) => {
      console.log('[Pusher Client] Received captain-added event:', data);
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        return {
          ...prevJam,
          captains: [...(prevJam.captains || []), data.captain]
        };
      });
    });

    // Handle song played status updates
    channel.bind('song-played', (data) => {
      console.log('[Pusher Client] Received song-played event:', data);
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        const updatedSongs = prevJam.songs.map(s => 
          s._id === data.songId ? { ...s, played: data.played } : s
        );
        
        return {
          ...prevJam,
          songs: updatedSongs
        };
      });
    });

    // Handle song additions
    channel.bind('song-added', (data) => {
      console.log('[Pusher Client] Received song-added event:', data);
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        // Add the new song to the jam's songs array
        const newState = {
          ...prevJam,
          songs: [...prevJam.songs, data.song]
        };
        
        // Sort by votes if that's the current sort method
        if (sortMethod === 'votes') {
          newState.songs.sort((a, b) => b.votes - a.votes);
        }

        // Set the lastAddedSongId to trigger highlight
        if (data.song._id) {
          console.log('[Pusher Client] Setting lastAddedSongId from Pusher:', data.song._id);
          setLastAddedSongId(data.song._id);
          setTimeout(() => {
            console.log('[Pusher Client] Clearing lastAddedSongId from Pusher');
            setLastAddedSongId(null);
          }, 3000);
        }
        
        return newState;
      });
    });

    // Handle song removals
    channel.bind('song-removed', (data) => {
      console.log('[Pusher Client] Received songRemoved event:', data);
      setJam(prevJam => {
        if (!prevJam) return prevJam;

        const newState = {
          ...prevJam,
          songs: prevJam.songs.filter(s => s._id !== data.songId)
        };
        return newState;
      });
    });

    // Handle song edits
    channel.bind('song-edited', (data) => {
      console.log('[Pusher Client] Received song-edited event:', data);
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        const updatedSongs = prevJam.songs.map(s => 
          s.song._id === data.songId 
            ? { ...s, song: data.updatedSong }
            : s
        );
        
        // Re-group songs if needed
        if (groupingEnabled) {
          return {
            ...prevJam,
            songs: updatedSongs
          };
        }
        
        return {
          ...prevJam,
          songs: updatedSongs
        };
      });
    });

    // Handle connection state changes
    const connectionHandler = (states) => {
      console.log('[Pusher Client] Connection state changed:', states.current);
    };
    pusherClient.connection.bind('state_change', connectionHandler);

    // Clean up on unmount
    return () => {
      console.log('[Pusher Client] Cleaning up Pusher connection');
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      pusherClient.connection.unbind('state_change', connectionHandler);
    };
  }, [params.id, sortMethod]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading jam</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !jam) {
    return (
      <LoadingBlock />
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{jam.name}</h1>
        <div className="flex items-center gap-2">
          <p className="text-gray-600">
            {new Date(jam.jamDate).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white shadow-sm rounded-lg p-3 border border-gray-200">
        <div className="flex-1 max-w-xl">
          <SongAutocomplete 
            ref={songAutocompleteRef}
            onSelect={handleSelectExisting} 
            onAddNew={handleAddNew}
            currentSongs={jam.songs}
            maxWidth="w-full"
          />
        </div>

        <div className="flex items-center space-x-4 ml-4">
          <Select value={groupingEnabled ? 'type' : 'none'} onValueChange={(value) => setGroupingEnabled(value === 'type')}>
            <SelectTrigger className="w-auto border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Group by banger/ballad</SelectItem>
              <SelectItem value="none">No grouping</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Song List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        {groupingEnabled ? (
          <>
            {/* Bangers Section */}
            <div className="border-b border-gray-200">
              <div className="bg-indigo-800 px-4 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FireIcon className="w-5 h-5 mr-2" /> Bangers
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                <SongList 
                  songs={getGroupedSongs(jam.songs).bangers}
                  nextSongId={getGroupedSongs(jam.songs).nextSongId}
                  onVote={handleVote}
                  onRemove={setSongToDelete}
                  onTogglePlayed={handleTogglePlayed}
                  onEdit={handleEdit}
                  hideTypeBadge={true}
                  emptyMessage="No bangers yet - vote up your favorites!"
                  groupingEnabled={groupingEnabled}
                  lastAddedSongId={lastAddedSongId}
                />
              </ul>
            </div>
            
            {/* Ballads Section */}
            <div>
              <div className="bg-indigo-800 px-4 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <MusicalNoteIcon className="w-5 h-5 mr-2" /> Ballads
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                <SongList 
                  songs={getGroupedSongs(jam.songs).ballads}
                  nextSongId={getGroupedSongs(jam.songs).nextSongId}
                  onVote={handleVote}
                  onRemove={setSongToDelete}
                  onTogglePlayed={handleTogglePlayed}
                  onEdit={handleEdit}
                  hideTypeBadge={true}
                  emptyMessage="No ballads yet - add some chill tunes!"
                  groupingEnabled={groupingEnabled}
                  lastAddedSongId={lastAddedSongId}
                />
              </ul>
            </div>
          </>
        ) : (
          <ul className="divide-y divide-gray-200">
            <SongList 
              songs={getGroupedSongs(jam.songs).ungrouped}
              nextSongId={getGroupedSongs(jam.songs).nextSongId}
              onVote={handleVote}
              onRemove={setSongToDelete}
              onTogglePlayed={handleTogglePlayed}
              onEdit={handleEdit}
              hideTypeBadge={false}
              emptyMessage="No songs yet - add some tunes!"
              groupingEnabled={groupingEnabled}
              lastAddedSongId={lastAddedSongId}
            />
          </ul>
        )}
      </div>

      <CreateSongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialTitle={newSongTitle}
        onAdd={handleAddSong}
        jamId={params.id}
      />

      <ConfirmDialog
        isOpen={!!songToDelete}
        onClose={() => setSongToDelete(null)}
        onConfirm={() => songToDelete && handleRemove(songToDelete._id)}
        title="Remove Song"
        description={songToDelete && `Are you sure you want to remove "${songToDelete.song.title}" by ${songToDelete.song.artist} from this jam? This action cannot be undone.`}
        confirmText="Remove Song"
        confirmLoadingText="Removing..."
        isLoading={isRemoving}
      />

    </>
  );
} 