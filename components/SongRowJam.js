import { useState, useCallback, useEffect } from "react";
import SongFormModal from "@/components/CreateSongModal";
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import SongVotingButton, { yourVote } from "@/components/SongVotingButton";
import CaptainBadges from "@/components/CaptainBadges";
import BaseSongRow from "@/components/SongRowBase";
import KnowBar from "@/components/jam/KnowBar";

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
  hostMode,
  maxAnswers = 0
}) {
  const { song } = jamSong;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // This device's vote, read from localStorage after mount (null until then
  // so the server render and first client render match)
  const [vote, setVote] = useState(null);
  const refreshVote = useCallback(() => setVote(yourVote(jamSong)), [jamSong]);
  useEffect(() => {
    refreshVote();
  }, [refreshVote]);
  
  const handleTogglePlayed = useCallback(async () => {
    await onTogglePlayed(jamSong._id);
  }, [jamSong._id, jamSong.played, onTogglePlayed]);
  
  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  return (
    <>
      <BaseSongRow
        song={song}
        isNext={isNext}
        hideType={hideType}
        // Plays / last played live in the Edit Song form to keep the jam list uncluttered
        hidePlayStats
        className={jamSong.played ? 'bg-gray-200 opacity-50' : ''}
        leftControl={
          <SongVotingButton
            jamSong={jamSong}
            vote={vote}
            onVote={onVote}
            onKnow={onKnow}
            onChange={refreshVote}
          />
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
          <>
            <CaptainBadges jamSong={jamSong} isNext={isNext} />
            {/* Hosts see how the whole room answered; everyone sees their own vote on the left */}
            {hostMode && (
              <KnowBar
                jamSong={jamSong}
                maxAnswers={maxAnswers}
                status={vote === 'love' ? 'know' : vote}
              />
            )}
          </>
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
