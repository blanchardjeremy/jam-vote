import { useEffect, useRef } from 'react';
import { pusherClient } from "@/lib/pusher";
import { toast } from 'sonner';
import { handlePositionHighlight } from '@/lib/services/jamSongs';

export function useJamPusher({ 
  jam, 
  setJam, 
  sortMethod, 
  groupingEnabled,
  clearHighlightAfterDelay 
}) {
  const lastToastId = useRef(null);
  const lastVoteToastId = useRef(null);
  const lastCaptainToastId = useRef(null);

  useEffect(() => {
    if (!jam?._id) return;
    
    const channelName = `jam-${jam._id}`;
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
          if (!prevJam?.songs) {
            return prevJam;
          }

          const songIndex = prevJam.songs.findIndex(s => s._id.toString() === data.songId);
          const songToUpdate = prevJam.songs[songIndex];
          
          if (!songToUpdate || songToUpdate.votes === data.votes) {
            return prevJam;
          }

          // Show toast for vote change
          const toastId = `${data.songId}-${data.votes}`;
          if (lastVoteToastId.current !== toastId && !data.silent) {
            const voteChange = data.votes - songToUpdate.votes;
            if (voteChange > 0) {
              toast.success(`Vote added for "${songToUpdate.song.title}" by ${songToUpdate.song.artist}`);
            } else {
              toast.info(`Vote removed for "${songToUpdate.song.title}" by ${songToUpdate.song.artist}`);
            }
            lastVoteToastId.current = toastId;
          }

          let updatedSongs = [...prevJam.songs];
          
          if (sortMethod === 'votes') {
            const oldPosition = songIndex;
            updatedSongs[songIndex] = { ...songToUpdate, votes: data.votes };
            updatedSongs.sort((a, b) => b.votes - a.votes);
            const newPosition = updatedSongs.findIndex(s => s._id.toString() === data.songId);
            
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
        const currentUserName = localStorage.getItem('userFirstName');
        
        if (currentUserName !== data.captain.name) {
          toast.success(`${data.captain.name} signed up to be a song captain`);
        }
        
        setJam(prevJam => ({
          ...prevJam,
          songs: prevJam.songs.map(song => 
            song._id === data.songId
              ? { ...song, captains: [...(song.captains || []), data.captain] }
              : song
          )
        }));
      });

      channel.bind('captain-removed', (data) => {
        const currentUserName = localStorage.getItem('userFirstName');
        
        if (currentUserName !== data.captain.name) {
          toast.info(`${data.captain.name} was removed as a song captain`);
        }
        
        setJam(prevJam => ({
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
        }));
      });

      // Handle song played status updates
      channel.bind('song-played', (data) => {
        setJam(prevJam => ({
          ...prevJam,
          songs: prevJam.songs.map(s => 
            s._id === data.songId ? { 
              ...s, 
              played: data.played,
              playedAt: data.playedAt
            } : s
          )
        }));
      });

      // Handle song removals
      channel.bind('song-removed', (data) => {
        toast.error(`"${data.songTitle}" by ${data.songArtist} was removed from the jam`);

        setJam(prevJam => ({
          ...prevJam,
          songs: prevJam.songs.filter(s => s.song._id.toString() !== data.songId.toString())
        }));
      });

      // Handle song edits
      channel.bind('song-edited', (data) => {
        setJam(prevJam => ({
          ...prevJam,
          songs: prevJam.songs.map(s => 
            s.song._id === data.songId 
              ? { ...s, song: data.updatedSong }
              : s
          )
        }));
      });
    };

    // Bind events immediately
    bindEvents();

    // Handle connection state changes
    const connectionHandler = (states) => {
      console.log('[Pusher Debug] Connection state changed:', states.current);
      if (states.current === 'connected') {
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
  }, [jam, sortMethod, groupingEnabled]);
} 