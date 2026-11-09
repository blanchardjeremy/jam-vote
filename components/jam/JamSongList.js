import { useEffect, useRef } from 'react';
import SongRow from "@/components/SongRowJam";
import { useJam } from '@/components/JamContext';

export default function JamSongList({ 
  songs, 
  nextSongId, 
  onVote, 
  onKnow,
  onRemove, 
  onTogglePlayed, 
  onEdit, 
  hideTypeBadge, 
  emptyMessage, 
  groupingEnabled, 
  lastAddedSongId,
  type,
  hostMode = false
}) {
  // Know bars are scaled to the most-answered song across the whole jam, so
  // bars in the Bangers and Ballads lists compare fairly
  const { jam } = useJam();
  const maxAnswers = Math.max(0, ...(jam?.songs || []).map((s) => (s.knows || 0) + (s.dontKnows || 0)));

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
          onKnow={onKnow}
          onRemove={() => onRemove(jamSong)}
          onTogglePlayed={onTogglePlayed}
          onEdit={onEdit}
          isNext={jamSong._id === nextSongId}
          hideType={hideTypeBadge}
          groupingEnabled={groupingEnabled}
          highlight={willHighlight}
          hostMode={hostMode}
          maxAnswers={maxAnswers}
        />
      </li>
    );
  });
} 