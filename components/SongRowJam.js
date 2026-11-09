import { useState, useCallback, useEffect } from "react";
import SongFormModal from "@/components/CreateSongModal";
import Link from "next/link";
import { useParams } from 'next/navigation';
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import SongVotingButton from "@/components/SongVotingButton";
import CaptainBadges from "@/components/CaptainBadges";
import BaseSongRow from "@/components/SongRowBase";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";
import { answerStatus } from "@/lib/utils/guideQueue";
import KnowBar from "@/components/jam/KnowBar";
import { AcademicCapIcon, QuestionMarkCircleIcon, EllipsisHorizontalCircleIcon } from "@heroicons/react/24/outline";

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
  const { slug } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // This device's answer, read from localStorage after mount (null until then
  // so the server render and first client render match)
  const [status, setStatus] = useState(null);
  useEffect(() => {
    setStatus(answerStatus(jamSong));
  }, [jamSong]);
  
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
    // The heart button has already saved this device's vote, so the row's
    // answer updates right away instead of waiting for the server
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
            {/* Hosts see how the whole room answered; everyone else sees their own answer */}
            {hostMode ? (
              <KnowBar jamSong={jamSong} maxAnswers={maxAnswers} status={status} />
            ) : (
              <YourAnswer status={status} played={jamSong.played} href={`/${slug}/guide?song=${jamSong._id}`} />
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

const ANSWER_ICONS = {
  know: { icon: AcademicCapIcon, label: 'You know it' },
  dontKnow: { icon: QuestionMarkCircleIcon, label: "You don't know it" },
  unsure: { icon: EllipsisHorizontalCircleIcon, label: "You're not sure" },
};

// This device's answer for a song: a quiet icon once answered, or a "Vote"
// badge that opens guided voting on this song when it hasn't been answered.
function YourAnswer({ status, played, href }) {
  if (!status) return null;
  if (status === 'unanswered') {
    if (played) return null;
    return (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Vote
      </Link>
    );
  }
  const { icon: Icon, label } = ANSWER_ICONS[status];
  return (
    <span title={label} className="inline-flex text-gray-400">
      <Icon aria-hidden className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
