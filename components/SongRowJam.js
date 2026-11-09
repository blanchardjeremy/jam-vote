import { useState, useCallback, useEffect } from "react";
import SongFormModal from "@/components/CreateSongModal";
import { useParams } from 'next/navigation';
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import SongVotingButton from "@/components/SongVotingButton";
import CaptainBadges from "@/components/CaptainBadges";
import BaseSongRow from "@/components/SongRowBase";
import { alsoMarkKnownForLove } from "@/lib/services/jamSongs";
import { answerStatus } from "@/lib/utils/guideQueue";
import { CheckIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

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
  const youKnowIt = status === 'know';
  // If this device knows it, the count includes at least this person
  const knowCount = youKnowIt ? Math.max(jamSong.knows || 0, 1) : jamSong.knows || 0;
  
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
            <KnowBar
              knows={knowCount}
              dontKnows={jamSong.dontKnows || 0}
              maxAnswers={maxAnswers}
              youKnowIt={youKnowIt}
            />
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

// How well the room knows this song: one small bar whose length is how many
// people answered (scaled to the most-answered song in the jam), split into
// "know it" (solid) and "don't know it" (faint). A check before it means you
// know it. Hidden until anyone in the jam has answered.
function KnowBar({ knows, dontKnows, maxAnswers, youKnowIt }) {
  const scale = Math.max(maxAnswers, knows + dontKnows);
  if (scale === 0) return null;
  const answered = knows + dontKnows;
  const label = `${knows} know it, ${dontKnows} don't`;

  return (
    <span className="inline-flex items-center gap-1" title={label}>
      <CheckIcon
        aria-hidden
        className={cn('h-3.5 w-3.5 text-primary', !youKnowIt && 'invisible')}
      />
      <span aria-hidden className="flex h-1.5 w-14 overflow-hidden rounded-full bg-gray-200/70">
        <span
          className="flex h-full overflow-hidden rounded-full"
          style={{ width: `${(answered / scale) * 100}%` }}
        >
          <span className="h-full bg-primary" style={{ width: answered ? `${(knows / answered) * 100}%` : 0 }} />
          <span className="h-full flex-1 bg-primary/25" />
        </span>
      </span>
      <span className="sr-only">
        {label}{youKnowIt ? ', including you' : ''}
      </span>
    </span>
  );
}
