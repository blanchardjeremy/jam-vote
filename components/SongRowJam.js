import { useState, useCallback } from "react";
import SongFormModal from "@/components/CreateSongModal";
import { useParams } from 'next/navigation';
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import SongVotingButton from "@/components/SongVotingButton";
import SongKnowButton from "@/components/SongKnowButton";
import CaptainBadges from "@/components/CaptainBadges";
import BaseSongRow from "@/components/SongRowBase";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";

export default function SongRow({ 
  jamSong, 
  onVote, 
  onKnow,
  onRemove, 
  onTogglePlayed, 
  onEdit, 
  isNext, 
  hideType,
  highlight,
  hostMode
}) {
  const { song } = jamSong;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleTogglePlayed = useCallback(async () => {
    await onTogglePlayed(jamSong._id);
  }, [jamSong._id, jamSong.played, onTogglePlayed]);
  
  // A heart also marks the song as known (once per person)
  const handleVote = (id, action) => {
    if (action === 'vote' && onKnow) {
      alsoMarkKnownForLove(id, (songId) => onKnow(songId, 'know'));
    }
    return onVote(id, action);
  };

  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  return (
    <>
      <BaseSongRow
        song={song}
        isNext={isNext}
        hideType={hideType}
        className={jamSong.played ? 'bg-gray-200 opacity-50' : ''}
        leftControl={
          <div className="flex items-start">
            <SongVotingButton jamSong={jamSong} onVote={handleVote} />
            <SongKnowButton jamSong={jamSong} onKnow={onKnow} />
          </div>
        }
        rightActions={
          <SongRowButtonToolbar
            song={song}
            jamSong={jamSong}
            handleTogglePlayed={handleTogglePlayed}
            setIsEditModalOpen={setIsEditModalOpen}
            onRemove={onRemove}
            hostMode={hostMode}
          />
        }
        additionalInfo={
          <CaptainBadges jamSong={jamSong} isNext={isNext} />
        }
        highlight={highlight}
      />

      {/* Modals */}
      <SongFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        initialData={song}
        mode="edit"
      />
    </>
  );
} 