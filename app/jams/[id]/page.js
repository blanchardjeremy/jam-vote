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
import { ArrowDownNarrowWide } from 'lucide-react';
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
import { useJamSongOperations, addSongToJam, handlePositionHighlight } from '@/lib/services/jamSongs';
import { fetchSongs } from '@/lib/services/songs';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageTitle from '@/components/ui/page-title';

// Helper component for rendering song lists
function SongList({ songs, nextSongId, onVote, onRemove, onTogglePlayed, onEdit, hideTypeBadge, emptyMessage, groupingEnabled, lastAddedSongId }) {
  // Add ref for the newly added song
  const lastAddedRef = useRef(null);

  // Scroll to newly added song when lastAddedSongId changes
  useEffect(() => {
    if (lastAddedSongId && lastAddedRef.current) {
      lastAddedRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [lastAddedSongId]);

  if (songs.length === 0) {
    return (
      <li className="px-4 py-3 text-sm text-gray-500 italic">
        {emptyMessage}
      </li>
    );
  }

  return songs.map((jamSong, index) => {
    // Use lastAddedSongId highlight or the song's own highlight from vote changes
    const willHighlight = jamSong._id === lastAddedSongId ? 'success' : jamSong.highlight;
    return (
      <li 
        key={`${jamSong.song._id}-${index}`} 
        className="hover:bg-gray-50"
        ref={jamSong._id === lastAddedSongId ? lastAddedRef : null}
      >
        <SongRow 
          jamSong={jamSong} 
          onVote={onVote} 
          onRemove={() => onRemove(jamSong)}
          onTogglePlayed={onTogglePlayed}
          onEdit={onEdit}
          isNext={jamSong._id === nextSongId}
          hideType={hideTypeBadge}
          groupingEnabled={groupingEnabled}
          highlight={willHighlight}
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
  const lastToastId = useRef(null);
  const lastVoteToastId = useRef(null);
  const lastCaptainToastId = useRef(null);
  const highlightTimeouts = useRef({});

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(highlightTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const clearHighlightAfterDelay = (songId) => {
    // Clear any existing timeout for this song
    if (highlightTimeouts.current[songId]) {
      clearTimeout(highlightTimeouts.current[songId]);
    }

    // Set new timeout
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
    sortMethod,
    clearHighlightAfterDelay
  });

  // Helper function to add a song to the jam
  const handleAddSongToJam = async (songId) => {
    try {
      const { jam: updatedJam } = await addSongToJam(params.id, songId);
      
      // Update local state immediately
      setJam(updatedJam);
      
      // Find the newly added song (it will be the last one in the array)
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
      // Only show error toast, success toast will come through Pusher
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
      // Check if song already exists in the jam
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
    const sortWithinGroup = (songs, isPlayed = false) => {
      return [...songs].sort((a, b) => {
        if (isPlayed) {
          // For played songs, sort by playedAt timestamp (oldest first)
          const aTime = a.playedAt ? new Date(a.playedAt).getTime() : 0;
          const bTime = b.playedAt ? new Date(b.playedAt).getTime() : 0;
          return aTime - bTime;
        } else {
          // For unplayed songs, sort by votes
          return b.votes - a.votes;
        }
      });
    };

    // First split into played and unplayed
    const playedSongs = songs.filter(song => song.played);
    const unplayedSongs = songs.filter(song => !song.played);

    if (!groupingEnabled) {
      // Even in ungrouped view, we still want played songs at the top
      const sortedPlayed = sortWithinGroup(playedSongs, true);
      const sortedUnplayed = sortWithinGroup(unplayedSongs, false);
      
      // Find next unplayed song
      const nextSongId = sortedUnplayed[0]?._id;
      
      return { 
        ungrouped: [...sortedPlayed, ...sortedUnplayed],
        nextSongId 
      };
    }

    // For grouped view, split each played status group into bangers and ballads
    const playedBangers = sortWithinGroup(playedSongs.filter(song => song.song.type === 'banger'), true);
    const playedBallads = sortWithinGroup(playedSongs.filter(song => song.song.type === 'ballad'), true);
    const unplayedBangers = sortWithinGroup(unplayedSongs.filter(song => song.song.type === 'banger'), false);
    const unplayedBallads = sortWithinGroup(unplayedSongs.filter(song => song.song.type === 'ballad'), false);

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
    const channelName = `jam-${params.id}`;
    console.log('[Pusher Debug] Setting up channel:', channelName);
    
    // First unsubscribe to clean up any existing subscriptions
    pusherClient.unsubscribe(channelName);
    
    // Then create a new subscription
    const channel = pusherClient.subscribe(channelName);

    // Bind all events immediately
    const bindEvents = () => {
      console.log('[Pusher Debug] Binding events for channel:', channelName);
      
      // Clean up any existing bindings first
      channel.unbind_all();

      // Handle song additions
      channel.bind('song-added', (data) => {
        console.log('[Pusher Debug] Received song-added event:', data);
        // Only show toast if we haven't shown it for this song
        if (lastToastId.current !== data.song._id) {
          toast.success(`"${data.song.song.title}" by ${data.song.song.artist} was added to the jam`);
          lastToastId.current = data.song._id;
        }
        
        setJam(prevJam => {
          if (!prevJam) return prevJam;
          return {
            ...prevJam,
            songs: [...prevJam.songs, data.song]
          };
        });
      });

      // Handle vote updates
      channel.bind('vote', (data) => {
        console.log('[Pusher Debug] Received vote event:', data);
        
        setJam(prevJam => {
          console.log('[Vote Debug] Previous jam state:', {
            songCount: prevJam?.songs?.length,
            sortMethod
          });
          
          if (!prevJam?.songs) {
            console.log('[Vote Debug] No songs found in jam');
            return prevJam;
          }

          const songIndex = prevJam.songs.findIndex(s => s._id.toString() === data.songId);
          const songToUpdate = prevJam.songs[songIndex];
          
          console.log('[Vote Debug] Found song:', {
            songIndex,
            currentVotes: songToUpdate?.votes,
            newVotes: data.votes
          });
          
          if (!songToUpdate || songToUpdate.votes === data.votes) {
            console.log('[Vote Debug] No update needed');
            return prevJam;
          }

          // Show toast for vote change only if we haven't shown it for this vote update
          const toastId = `${data.songId}-${data.votes}`;
          if (lastVoteToastId.current !== toastId) {
            const voteChange = data.votes - songToUpdate.votes;
            if (voteChange > 0) {
              toast.success(`Vote added for "${songToUpdate.song.title}" by ${songToUpdate.song.artist}`);
            } else {
              toast.info(`Vote removed for "${songToUpdate.song.title}" by ${songToUpdate.song.artist}`);
            }
            lastVoteToastId.current = toastId;
          }

          // Create a copy of songs for sorting
          let updatedSongs = [...prevJam.songs];
          
          // Only sort if we're using vote-based sorting
          if (sortMethod === 'votes') {
            // Get current position before updating votes
            const oldPosition = songIndex;
            
            // Update votes in the copy
            updatedSongs[songIndex] = { ...songToUpdate, votes: data.votes };
            
            // Sort to find new position
            updatedSongs.sort((a, b) => b.votes - a.votes);
            const newPosition = updatedSongs.findIndex(s => s._id.toString() === data.songId);
            
            console.log('[Vote Debug] Position change:', {
              songId: data.songId,
              oldPosition,
              newPosition,
              oldVotes: songToUpdate.votes,
              newVotes: data.votes
            });
            
            // Apply highlight if position changed
            if (newPosition !== oldPosition) {
              updatedSongs = handlePositionHighlight(
                updatedSongs, 
                data.songId, 
                oldPosition, 
                newPosition, 
                setJam,
                clearHighlightAfterDelay
              );
            }
          } else {
            // If not sorting by votes, just update the votes
            updatedSongs[songIndex] = { ...songToUpdate, votes: data.votes };
          }
          
          return {
            ...prevJam,
            songs: updatedSongs
          };
        });
      });

      // Handle captain updates
      channel.bind('captain-added', (data) => {
        console.log('[Captain Debug] Received captain-added event:', data);
        
        // Get current user's name from localStorage
        const currentUserName = localStorage.getItem('userFirstName');
        
        // Only show toast if it's not the current user
        if (currentUserName !== data.captain.name) {
          toast.success(`${data.captain.name} was added as a song captain`);
        }
        
        setJam(prevJam => {
          if (!prevJam) return prevJam;
          
          return {
            ...prevJam,
            songs: prevJam.songs.map(song => 
              song._id === data.songId
                ? { ...song, captains: [...(song.captains || []), data.captain] }
                : song
            )
          };
        });
      });

      // Handle captain removals
      channel.bind('captain-removed', (data) => {
        console.log('[Captain Debug] Received captain-removed event:', data);
        
        // Get current user's name from localStorage
        const currentUserName = localStorage.getItem('userFirstName');
        
        // Only show toast if it's not the current user
        if (currentUserName !== data.captain.name) {
        }
        
        setJam(prevJam => {
          if (!prevJam) return prevJam;
          
          return {
            ...prevJam,
            songs: prevJam.songs.map(song => 
              song._id === data.songId
                ? { 
                    ...song, 
                    captains: (song.captains || []).filter(c => 
                      !(c.name === data.captain.name && c.type === data.captain.type)
                    )
                  }
                : song
            )
          };
        });
      });

      // Handle song played status updates
      channel.bind('song-played', (data) => {
        setJam(prevJam => {
          if (!prevJam) return prevJam;
          
          const updatedSongs = prevJam.songs.map(s => 
            s._id === data.songId ? { 
              ...s, 
              played: data.played,
              playedAt: data.playedAt
            } : s
          );
          
          return {
            ...prevJam,
            songs: updatedSongs
          };
        });
      });

      // Handle song removals
      channel.bind('song-removed', (data) => {
        toast.error(`"${data.songTitle}" by ${data.songArtist} was removed from the jam`, {
          // style: {
          //   background: '#fef2f2',
          //   border: '1px solid #fee2e2',
          //   color: '#991b1b'
          // }
        });

        setJam(prevJam => {
          if (!prevJam) return prevJam;
          const newState = {
            ...prevJam,
            songs: prevJam.songs.filter(s => s.song._id.toString() !== data.songId.toString())
          };
          return newState;
        });
      });

      // Handle song edits
      channel.bind('song-edited', (data) => {
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
    };

    // Bind events immediately
    bindEvents();

    // Handle connection state changes
    const connectionHandler = (states) => {
      console.log('[Pusher Debug] Connection state changed:', states.current);
      if (states.current === 'connected') {
        // Rebind events when reconnected
        bindEvents();
      }
    };
    pusherClient.connection.bind('state_change', connectionHandler);

    // Clean up on unmount
    return () => {
      console.log('[Pusher Debug] Cleaning up - unsubscribing from:', channelName);
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      pusherClient.connection.unbind('state_change', connectionHandler);
    };
  }, [params.id]); // Remove sortMethod from dependencies to prevent rebinding

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
      <PageTitle title={jam?.name || 'Loading Jam...'} />
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
          <Select value={sortMethod} onValueChange={setSortMethod}>
            <SelectTrigger className="w-auto border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <ArrowDownNarrowWide className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">Sort by votes</SelectItem>
              <SelectItem value="least-played">Sort by least played</SelectItem>
            </SelectContent>
          </Select>

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
        onConfirm={async () => {
          if (songToDelete) {
            setIsRemoving(true);
            try {
              await handleRemove(songToDelete.song._id);
              setSongToDelete(null);
            } finally {
              setIsRemoving(false);
            }
          }
        }}
        title="Remove Song"
        description={songToDelete && `Are you sure you want to remove "${songToDelete.song.title}" by ${songToDelete.song.artist}" from this jam?`}
        confirmText="Remove"
        confirmLoadingText="Removing..."
        isLoading={isRemoving}
      />

    </>
  );
} 