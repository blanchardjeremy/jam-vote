'use client';

import { useState, useEffect } from 'react';
import SongAutocomplete from "@/components/SongAutocomplete";
import AddSongModal from "@/components/AddSongModal";
import { useParams } from 'next/navigation';
import SongRow from "@/components/SongRow";
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
import CaptainSignupButton from "@/components/CaptainSignupButton";

// Helper component for rendering song lists
function SongList({ songs, nextSongId, onVote, onRemove, onTogglePlayed, onEdit, hideTypeBadge, emptyMessage, groupingEnabled }) {
  if (songs.length === 0) {
    return (
      <li className="px-4 py-3 text-sm text-gray-500 italic">
        {emptyMessage}
      </li>
    );
  }

  return songs.map((jamSong, index) => (
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
      />
    </li>
  ));
}

export default function JamPage() {
  const params = useParams();
  const [jam, setJam] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [songToDelete, setSongToDelete] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [duplicateSong, setDuplicateSong] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState(true);
  const [sortMethod, setSortMethod] = useState('votes'); // 'votes' or 'manual'
  const [captains, setCaptains] = useState([]);

  // Function to determine if a song is a banger based on votes
  const isBanger = (song) => {
    // Consider a song a banger if it has more than 2 votes
    return song.votes > 2;
  };

  // Function to group songs
  const getGroupedSongs = (songs) => {
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
      setJam(data);
    } catch (e) {
      setError(e.message);
      console.error('Error in JamPage component:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJam();

    // Set up Pusher connection
    console.log('[Pusher Client] Setting up connection');
    const channelName = `jam-${params.id}`;
    const channel = pusherClient.subscribe(channelName);
    
    // Clean up any existing bindings first
    channel.unbind_all();
    
    setIsConnected(true);

    // Handle vote updates
    channel.bind('vote', (data) => {
      console.log('[Pusher Client] Received vote event:', data);
      setJam(prevJam => {
        if (!prevJam) {
          console.log('[Pusher Client] No previous jam state, skipping vote update');
          return prevJam;
        }
        
        // Only update if the vote count is different to avoid unnecessary re-renders
        const songToUpdate = prevJam.songs.find(s => s._id === data.songId);
        if (!songToUpdate || songToUpdate.votes === data.votes) {
          return prevJam;
        }
        
        const updatedSongs = prevJam.songs.map(s => 
          s._id === data.songId ? { ...s, votes: data.votes } : s
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
      console.log('[Pusher Client] Received songAdded event:', data);
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        // The song data is nested one level deeper than expected
        const newSong = data.song;
        const newState = {
          ...prevJam,
          songs: [...prevJam.songs, newSong].sort((a, b) => b.votes - a.votes)
        };
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
      setIsConnected(states.current === 'connected');
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

  const handleSelectExisting = async (song) => {
    try {
      // Check if song already exists in the jam
      if (jam.songs.some(existingSong => existingSong.song._id === song._id)) {
        setDuplicateSong(song);
        return;
      }

      const res = await fetch(`/api/jams/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: song._id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add song to jam');
      }

      const updatedJam = await res.json();
      setJam(updatedJam);
    } catch (e) {
      console.error('Error adding song to jam:', e);
      // Optionally show an error message to the user
    }
  };

  const handleAddNew = (title) => {
    setNewSongTitle(title);
    setIsModalOpen(true);
  };

  const handleAddSong = async (newSong) => {
    try {
      // Check if song already exists in the jam
      if (jam.songs.some(existingSong => existingSong.song._id === newSong._id)) {
        setDuplicateSong(newSong);
        setIsModalOpen(false);
        return;
      }

      const res = await fetch(`/api/jams/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: newSong._id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add song to jam');
      }

      const updatedJam = await res.json();
      setJam(updatedJam);
      setIsModalOpen(false);
    } catch (e) {
      console.error('Error adding new song to jam:', e);
      // Optionally show an error message to the user
    }
  };

  const handleVote = async (songId, action) => {
    try {
      // Optimistically update UI
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        const updatedSongs = prevJam.songs.map(s => 
          s._id === songId 
            ? { ...s, votes: action === 'vote' ? s.votes + 1 : s.votes - 1 }
            : s
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

      const res = await fetch(`/api/jams/${params.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId, action })
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setJam(prevJam => {
          if (!prevJam) return prevJam;
          
          const updatedSongs = prevJam.songs.map(s => 
            s._id === songId 
              ? { ...s, votes: action === 'vote' ? s.votes - 1 : s.votes + 1 }
              : s
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
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to vote for song');
      }
    } catch (e) {
      console.error('[Vote] Error:', e);
      throw e; // Propagate error to SongRow component
    }
  };

  const handleRemove = async (songId) => {
    try {
      setIsRemoving(true);
      // Optimistically update the UI
      setJam(prevJam => ({
        ...prevJam,
        songs: prevJam.songs.filter(s => s._id !== songId)
      }));

      const res = await fetch(`/api/jams/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId })
      });

      if (!res.ok) {
        // Revert the optimistic update if the request fails
        await fetchJam();
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove song');
      }
    } catch (e) {
      console.error('Error removing song:', e);
    } finally {
      setIsRemoving(false);
      setSongToDelete(null);
    }
  };

  const handleTogglePlayed = async (songId) => {
    try {
      // Optimistically update UI
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        const updatedSongs = prevJam.songs.map(s => 
          s._id === songId ? { ...s, played: !s.played } : s
        );
        
        return {
          ...prevJam,
          songs: updatedSongs
        };
      });

      const res = await fetch(`/api/jams/${params.id}/played`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId })
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setJam(prevJam => {
          if (!prevJam) return prevJam;
          
          const updatedSongs = prevJam.songs.map(s => 
            s._id === songId ? { ...s, played: !s.played } : s
          );
          
          return {
            ...prevJam,
            songs: updatedSongs
          };
        });
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update played status');
      }
    } catch (e) {
      console.error('Error updating played status:', e);
    }
  };

  const handleEdit = async (songId, updatedSong) => {
    try {
      // Optimistically update UI
      setJam(prevJam => {
        if (!prevJam) return prevJam;
        
        const updatedSongs = prevJam.songs.map(s => 
          s._id === songId 
            ? { ...s, song: { ...s.song, ...updatedSong } }
            : s
        );
        
        return {
          ...prevJam,
          songs: updatedSongs
        };
      });

      const res = await fetch(`/api/songs/${updatedSong._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSong)
      });

      if (!res.ok) {
        // Revert optimistic update on error
        await fetchJam();
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update song');
      }
    } catch (e) {
      console.error('Error updating song:', e);
    }
  };

  const handleCaptainSignup = (newCaptain) => {
    setCaptains(prev => [...prev, newCaptain]);
  };

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
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
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
      <div className="mb-4 flex items-center justify-between bg-white shadow-sm rounded-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth',
              });
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add New Song
          </button>

          <CaptainSignupButton jamId={params.id} onSignup={handleCaptainSignup} />
        </div>

        <div className="flex items-center space-x-4">
          <Select value={groupingEnabled ? 'type' : 'none'} onValueChange={(value) => setGroupingEnabled(value === 'type')}>
            <SelectTrigger className="w-auto border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Group by banger/ballad</SelectItem>
              <SelectItem value="none">No grouping</SelectItem>
            </SelectContent>
          </Select>

          {/* <Separator orientation="vertical" className="h-6" />

          <Select value={sortMethod} onValueChange={setSortMethod}>
            <SelectTrigger className="w-44 border-none text-gray-500 focus:text-gray-900 text-sm focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">Sort by votes</SelectItem>
              <SelectItem value="manual">Sort manually</SelectItem>
            </SelectContent>
          </Select> */}
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
            />
          </ul>
        )}
      </div>

      <div className="mt-6">
        <SongAutocomplete 
          onSelect={handleSelectExisting} 
          onAddNew={handleAddNew}
          currentSongs={jam.songs}
        />
      </div>

      <AddSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTitle={newSongTitle}
        onAdd={handleAddSong}
        jamId={params.id}
      />

      <AlertDialog open={!!songToDelete} onOpenChange={(open) => !open && setSongToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Song</AlertDialogTitle>
            <AlertDialogDescription>
              {songToDelete && `Are you sure you want to remove "${songToDelete.song.title}" by ${songToDelete.song.artist} from this jam? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => songToDelete && handleRemove(songToDelete._id)}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isRemoving ? 'Removing...' : 'Remove Song'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!duplicateSong} onOpenChange={(open) => !open && setDuplicateSong(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Song Already Added</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateSong && `"${duplicateSong.title}" by ${duplicateSong.artist} is already in this jam's playlist.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDuplicateSong(null)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 