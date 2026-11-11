import { useState, useCallback, useEffect, useRef } from "react";
import SongFormModal from "@/components/CreateSongModal";
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import { toast } from "sonner";
import { UserIcon, FireIcon, MusicalNoteIcon } from "@heroicons/react/24/solid";
import { UserIcon as UserOutline } from "@heroicons/react/24/outline";
import HeartToggle, { yourVote, toggleVote, VoteHeart } from "@/components/SongVoteControls";
import SwipeActions from "@/components/SwipeActions";
import CaptainNameModal from "@/components/CaptainNameModal";
import { useJam } from "@/components/JamContext";
import { signUpAsCaptain, removeAsCaptain } from "@/lib/services/captains";
import { markViewed } from "@/lib/utils/guideQueue";
import { useSeenOnScreen } from "@/lib/hooks/useSeenOnScreen";
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
  onVoteChange,
  onViewed
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
  // Once a new song's row has been on screen for a second it counts as
  // viewed, quietly in the background. This drives the "New" filter only;
  // there's nothing to see on the row itself.
  const isNew = vote === 'new' && !jamSong.played;
  const rowRef = useSeenOnScreen(isNew, () => {
    markViewed(jamSong._id);
    refreshVote();
    onViewed?.();
  });

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
  
  // Host tools: swipe left to switch the song to the other type (banger <->
  // ballad). Always the same direction, whichever type it is now. Works on
  // sung songs too, since that's often when you notice.
  const otherType = song.type === 'banger' ? 'ballad' : 'banger';
  const otherSection = otherType === 'banger' ? 'Bangers' : 'Ballads';
  const hostSwipes = {
    left: {
      label: `Move to ${otherSection}`,
      icon: otherType === 'banger' ? <FireIcon className="h-6 w-6" /> : <MusicalNoteIcon className="h-6 w-6" />,
      color: otherType === 'banger' ? 'bg-orange-400' : 'bg-sky-400',
      readyColor: otherType === 'banger' ? 'bg-orange-500' : 'bg-sky-600',
      onSwipe: () => onEdit?.(jamSong._id, { type: otherType }, `Moved ${song.title} to ${otherSection}`),
    },
    right: null,
  };

  // Host tools: double-tap a song to add it to favorites. It only adds, so a
  // stray double tap can't take a favorite away.
  const lastTap = useRef(0);
  const handleDoubleTap = (e) => {
    // Taps on the row's buttons and links don't count
    if (e.target.closest('button, a')) return;
    const now = Date.now();
    if (now - lastTap.current > 350) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    if (song.favorite) {
      toast(`${song.title} is already a favorite`);
      return;
    }
    onEdit?.(jamSong._id, { favorite: true }, `Added ${song.title} to favorites`);
  };

  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  return (
    <>
      {/* Swipe left to vote (the easy thumb motion), right to captain.
          With host tools on: left moves it to the other section (banger <-> ballad). */}
      <div ref={rowRef}>
      <SwipeActions
        // Played songs can't be voted on or captained, but the host can
        // still move them between Bangers and Ballads
        disabled={hostMode ? false : jamSong.played || !vote}
        left={hostMode ? hostSwipes.left : vote === 'voted'
          ? { label: 'Unvote', icon: <VoteHeart className="h-6 w-6" />, color: 'bg-gray-400', readyColor: 'bg-gray-500', onSwipe: () => toggleVote(jamSong, vote, voteProps) }
          : { label: 'Vote', icon: <VoteHeart filled className="h-6 w-6" />, color: 'bg-rose-300', readyColor: 'bg-rose-500', onSwipe: () => toggleVote(jamSong, vote, voteProps) }}
        right={hostMode ? hostSwipes.right : isCaptain
          ? { label: 'Uncaptain', icon: <UserOutline className="h-6 w-6" />, color: 'bg-gray-400', readyColor: 'bg-gray-500', onSwipe: toggleCaptain }
          : { label: 'Captain', icon: <UserIcon className="h-6 w-6" />, color: 'bg-indigo-400', readyColor: 'bg-indigo-600', onSwipe: toggleCaptain }}
      >
      <BaseSongRow
        song={song}
        isNext={isNext}
        hideType={hideType}
        // Plays / last played live in the Edit Song form to keep the jam list uncluttered
        hidePlayStats
        onClick={hostMode ? handleDoubleTap : undefined}
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
      </div>

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
