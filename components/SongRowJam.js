import { useState, useCallback, useEffect } from "react";
import SongFormModal from "@/components/CreateSongModal";
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import HeartToggle, { VoteMark, yourVote } from "@/components/SongVoteControls";
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
  maxAnswers = 0,
  onVoteChange
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
  
  const onChange = () => {
    refreshVote();
    onVoteChange?.();
  };
  const voteProps = { jamSong, vote, onVote, onKnow, onChange };
  // Songs you haven't voted on yet get a dot, like an unread email
  const isNew = vote === 'unanswered' && !jamSong.played;

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
        titleClassName={isNew && 'text-primary'}
        titleAdornment={isNew && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" role="img" aria-label="Not voted yet" />
        )}
        className={jamSong.played ? 'bg-gray-200 opacity-50' : ''}
        leftControl={<HeartToggle {...voteProps} />}
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
            {/* Your vote, then how the whole room voted */}
            <div className="flex items-center gap-1.5">
              <VoteMark {...voteProps} />
              <KnowBar
                jamSong={jamSong}
                maxAnswers={maxAnswers}
                status={vote === 'love' ? 'know' : vote}
              />
            </div>
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
