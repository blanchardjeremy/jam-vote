import { useState, useCallback, useEffect } from "react";
import SongFormModal from "@/components/CreateSongModal";
import { useParams } from 'next/navigation';
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import SongVotingButton from "@/components/SongVotingButton";
import CaptainBadges from "@/components/CaptainBadges";
import BaseSongRow from "@/components/SongRowBase";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";
import { answerStatus } from "@/lib/utils/guideQueue";
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

  // This device's answer, read from localStorage after mount (null until then
  // so the server render and first client render match)
  const [status, setStatus] = useState(null);
  useEffect(() => {
    setStatus(answerStatus(jamSong));
  }, [jamSong]);
  const unanswered = status === 'unanswered' && !jamSong.played;
  
  const handleTogglePlayed = useCallback(async () => {
    await onTogglePlayed(jamSong._id);
  }, [jamSong._id, jamSong.played, onTogglePlayed]);
  
  // A heart also counts as "I know it" (once per person). Knowing a song
  // without loving it is only marked from guided voting.
  const handleVote = (id, action) => {
    if (action === 'vote' && onKnow) {
      alsoMarkKnownForLove(
        id,
        (songId) => onKnow(songId, 'know'),
        (songId) => onKnow(songId, 'undontknow')
      );
    }
    // The heart button has already saved this device's vote, so the dot and
    // check update right away instead of waiting for the server
    setStatus(answerStatus(jamSong));
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
        // Plays / last played live in the Edit Song form to keep the jam list uncluttered
        hidePlayStats
        className={jamSong.played ? 'bg-gray-200 opacity-50' : ''}
        titlePrefix={unanswered && (
          <span title="You haven't answered this one yet">
            <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
            <span className="sr-only">Not answered yet: </span>
          </span>
        )}
        leftControl={
          <SongVotingButton jamSong={jamSong} onVote={handleVote} />
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
            <KnowBar jamSong={jamSong} maxAnswers={maxAnswers} status={status} />
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
