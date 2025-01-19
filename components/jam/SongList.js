import { useEffect, useRef } from 'react';
import SongRow from "@/components/SongRowJam";

export default function SongList({ 
  songs, 
  nextSongId, 
  onVote, 
  onRemove, 
  onTogglePlayed, 
  onEdit, 
  hideTypeBadge, 
  emptyMessage, 
  groupingEnabled, 
  lastAddedSongId,
  type
}) {
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