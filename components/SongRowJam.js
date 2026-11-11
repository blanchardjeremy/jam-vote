import { useState, useCallback, useEffect } from "react";
import SongFormModal from "@/components/CreateSongModal";
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import { toast } from "sonner";
import { UserIcon } from "@heroicons/react/24/solid";
import { UserIcon as UserOutline } from "@heroicons/react/24/outline";
import HeartToggle, { yourVote, toggleVote, markSeen, VoteHeart } from "@/components/SongVoteControls";
import SwipeActions from "@/components/SwipeActions";
import CaptainNameModal from "@/components/CaptainNameModal";
import { useJam } from "@/components/JamContext";
import { signUpAsCaptain, removeAsCaptain } from "@/lib/services/captains";
import CaptainBadges from "@/components/CaptainBadges";
import BaseSongRow from "@/components/SongRowBase";

export default function SongRow({ 
  jamSong, 
  onVote, 
  onRemove, 
  onTogglePlayed, 
  onEdit, 
  isNext, 
  hideType,
  highlight,
  hostMode,
  onVoteChange
}) {
  const { song } = jamSong;
  const { jam } = useJam();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [askingName, setAskingName] = useState(false);

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
  const voteProps = { jamSong, vote, onVote, onChange };
  // Songs you haven't seen yet get a dot, like an unread email
  const isNew = vote === 'new' && !jamSong.played;

  // Your first name (saved on this device once you've given it), and whether
  // you already captain this song. Read after mount, like the vote.
  const [myName, setMyName] = useState(null);
  useEffect(() => {
    setMyName(localStorage.getItem('userFirstName'));
  }, [jamSong.captains]);
  const isCaptain = !!myName && (jamSong.captains || []).some((c) => c.name === myName);

  // Swipe right: sign up as a (regular) captain, or step down if you already are.
  // The captain list updates live once the server confirms.
  const signUp = (name) =>
    signUpAsCaptain(jam._id, jamSong._id, name)
      .then(() => toast.success(`You're captaining ${song.title}`))
      .catch((e) => toast.error(`Couldn't sign you up to captain: ${e.message}`));
  const toggleCaptain = () => {
    if (isCaptain) {
      removeAsCaptain(jam._id, jamSong._id, myName)
        .then(() => toast.success(`You're no longer captaining ${song.title}`))
        .catch((e) => toast.error(`Couldn't remove you as captain: ${e.message}`));
    } else if (myName) {
      signUp(myName);
    } else {
      // First time only: ask for a first name
      setAskingName(true);
    }
  };

  const handleTogglePlayed = useCallback(async () => {
    await onTogglePlayed(jamSong._id);
  }, [jamSong._id, jamSong.played, onTogglePlayed]);
  
  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  return (
    <>
      {/* Swipe left to vote (the easy thumb motion), right to captain */}
      <SwipeActions
        // Played songs can't be voted on or captained any more
        disabled={jamSong.played || !vote}
        left={vote === 'voted'
          ? { label: 'Unvote', icon: <VoteHeart className="h-6 w-6" />, color: 'bg-gray-400', readyColor: 'bg-gray-500', onSwipe: () => toggleVote(jamSong, vote, voteProps) }
          : { label: 'Vote', icon: <VoteHeart filled className="h-6 w-6" />, color: 'bg-rose-300', readyColor: 'bg-rose-500', onSwipe: () => toggleVote(jamSong, vote, voteProps) }}
        right={isCaptain
          ? { label: 'Uncaptain', icon: <UserOutline className="h-6 w-6" />, color: 'bg-gray-400', readyColor: 'bg-gray-500', onSwipe: toggleCaptain }
          : { label: 'Captain', icon: <UserIcon className="h-6 w-6" />, color: 'bg-indigo-400', readyColor: 'bg-indigo-600', onSwipe: toggleCaptain }}
      >
      <BaseSongRow
        song={song}
        isNext={isNext}
        hideType={hideType}
        // Plays / last played live in the Edit Song form to keep the jam list uncluttered
        hidePlayStats
        // Tapping a new song marks it seen
        onClick={isNew ? () => markSeen(jamSong, vote, voteProps) : undefined}
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
        additionalInfo={<CaptainBadges jamSong={jamSong} isNext={isNext} />}
        highlight={highlight}
      />
      </SwipeActions>

      {/* Modals */}
      <CaptainNameModal
        isOpen={askingName}
        onClose={() => setAskingName(false)}
        onSubmit={(name) => {
          setMyName(name);
          signUp(name);
        }}
      />
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
