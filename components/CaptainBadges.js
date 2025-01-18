import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { pusherClient } from "@/lib/pusher";

export default function CaptainBadges({ jamSong, isNext }) {
  const params = useParams();
  const [captains, setCaptains] = useState(jamSong.captains || []);
  
  useEffect(() => {
    // Initialize captains state
    setCaptains(jamSong.captains || []);

    // Set up Pusher subscription
    const channelName = `jam-${params.id}`;
    const channel = pusherClient.subscribe(channelName);

    // Handle captain updates
    channel.bind('captain-added', (data) => {
      if (data.songId === jamSong._id) {
        // Only add the captain if they're not already in the list
        setCaptains(prevCaptains => {
          const captainExists = prevCaptains.some(c => 
            c.name === data.captain.name && c.type === data.captain.type
          );
          if (captainExists) return prevCaptains;
          return [...prevCaptains, data.captain];
        });
      }
    });

    // Handle captain removals
    channel.bind('captain-removed', (data) => {
      if (data.songId === jamSong._id) {
        setCaptains(prevCaptains => 
          prevCaptains.filter(c => 
            !(c.name === data.captain.name && c.type === data.captain.type)
          )
        );
      }
    });

    return () => {
      channel.unbind('captain-added');
      channel.unbind('captain-removed');
    };
  }, [jamSong._id, jamSong.captains, params.id]);

  return (
    <div className="flex gap-1">
      {captains.map((captain, index) => (
        <Badge 
          key={`${captain.name}-${index}`}
          variant={isNext ? 'default' : 'secondary'}
          className="text-[10px] md:text-xs px-1.5 py-0 md:px-2 md:py-0.5"
        >
          {captain.name} {captain.type === 'piano' ? '🎹' : '🎤'}
        </Badge>
      ))}
    </div>
  );
} 