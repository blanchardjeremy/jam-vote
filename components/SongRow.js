import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { TrashIcon, PencilIcon, EllipsisHorizontalIcon, UserIcon } from "@heroicons/react/24/outline";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import SongFormModal from "@/components/AddSongModal";
import CaptainTypeModal from "@/components/CaptainTypeModal";
import { cn } from "@/lib/utils";
import { useParams } from 'next/navigation';

export default function SongRow({ jamSong, onVote, onRemove, onTogglePlayed, onEdit, isNext, hideType }) {
  const params = useParams();
  const { song } = jamSong;
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTogglingPlayed, setIsTogglingPlayed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCaptaining, setIsCaptaining] = useState(false);
  const [isCaptainLoading, setIsCaptainLoading] = useState(false);
  
  useEffect(() => {
    // Check localStorage on mount
    const voted = localStorage.getItem(`vote-${jamSong._id}`);
    setHasVoted(voted === 'true');
  }, [jamSong._id]);
  
  const handleVote = useCallback(async () => {
    if (isVoting) return;
    
    const newVoteState = !hasVoted;
    // Optimistically update UI and localStorage
    setHasVoted(newVoteState);
    setIsVoting(true);
    
    // Update localStorage optimistically
    if (newVoteState) {
      localStorage.setItem(`vote-${jamSong._id}`, 'true');
    } else {
      localStorage.removeItem(`vote-${jamSong._id}`);
    }
    
    try {
      const action = newVoteState ? 'vote' : 'unvote';
      await onVote(jamSong._id, action);
    } catch (error) {
      // Revert optimistic updates on error
      setHasVoted(!newVoteState);
      // Revert localStorage
      if (!newVoteState) {
        localStorage.setItem(`vote-${jamSong._id}`, 'true');
      } else {
        localStorage.removeItem(`vote-${jamSong._id}`);
      }
      console.error('Error voting for song:', error);
    } finally {
      setIsVoting(false);
    }
  }, [isVoting, hasVoted, jamSong._id, onVote]);

  const handleTogglePlayed = useCallback(async () => {
    if (isTogglingPlayed) return;
    
    // Optimistically update UI
    const newPlayedState = !jamSong.played;
    setIsTogglingPlayed(true);
    
    try {
      await onTogglePlayed(jamSong._id);
    } finally {
      setIsTogglingPlayed(false);
    }
  }, [isTogglingPlayed, jamSong._id, jamSong.played, onTogglePlayed]);
  
  // Determine which icon to show based on state
  const VoteIcon = hasVoted ? HeartSolid : HeartOutline;
  
  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  function getVoteButtonStyles() {
    if (jamSong.played) {
      return 'text-indigo-400 pointer-events-none';
    }
    
    if (hasVoted) {
      return 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50';
    }
    
    return 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50';
  }
  
  function getVoteIconStyles() {
    if (jamSong.played) {
      return 'text-indigo-400';
    }
    
    if (hasVoted) {
      return isHovered ? 'text-indigo-700' : 'text-indigo-600';
    }
    
    return isHovered ? 'text-indigo-600' : 'text-indigo-400';
  }
  
  const handleCaptainSubmit = async (type, name) => {
    if (isCaptainLoading) return;

    setIsCaptainLoading(true);
    try {
      const response = await fetch(`/api/jams/${params.id}/captain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          songId: jamSong._id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign up as captain');
      }

      // Close the modal on success
      setIsCaptaining(false);
    } catch (error) {
      console.error('Error signing up as captain:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsCaptainLoading(false);
    }
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(` border-2 border-transparent px-4 py-4 sm:px-6 ${jamSong.played ? 'bg-gray-100' : ''} ${
        isNext ? ' border-indigo-400 bg-indigo-50/50 ' : ''
      }`)}>
        <div className={`flex items-start gap-4 ${jamSong.played ? 'opacity-40' : ''}`}>
          {/* Vote Button */}
          <div className="flex flex-col items-center pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`
                    group flex flex-col items-center space-y p-2 -my-2 rounded-lg 
                    transition-all duration-150 ease-in-out cursor-pointer
                    ${isVoting ? 'opacity-75' : ''}
                    ${getVoteButtonStyles()}
                  `}
                  onClick={handleVote}
                  disabled={isVoting || jamSong.played}
                  onMouseEnter={() => !jamSong.played && setIsHovered(true)}
                  onMouseLeave={() => !jamSong.played && setIsHovered(false)}
                >
                  <VoteIcon 
                    className={`
                      h-7 w-7 
                      transition-all duration-150 ease-in-out
                      ${getVoteIconStyles()}
                    `}
                  />
                  <span className={`
                    text-md font-medium
                    transition-colors duration-150 ease-in-out
                    ${getVoteIconStyles()}
                  `}>
                    {jamSong.votes}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {jamSong.played 
                    ? 'Song has been played' 
                    : hasVoted 
                      ? 'Remove your vote' 
                      : 'Vote for this song'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Main Content Container */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Title, Type, and Chords Link */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <h2 className={`text-lg font-semibold ${isNext ? 'text-indigo-500' : ''}`}>
                  {song.title}
                </h2>
                {!hideType && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    song.type === 'banger' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {song.type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {song.chordChart && (
                    <SongRowButton
                      icon={MusicalNoteIcon}
                      href={song.chordChart}
                      tooltip="View chord chart"
                    />
                  )}
                  <SongRowButton
                    icon={UserIcon}
                    onClick={() => setIsCaptaining(true)}
                    disabled={jamSong.played || isCaptainLoading}
                    isLoading={isCaptainLoading}
                    tooltip={jamSong.played ? 'Cannot captain a played song' : 'Sign up to captain'}
                    className="hover:text-indigo-600 hover:bg-indigo-50"
                  />
                  <SongRowButton
                    icon={jamSong.played ? CheckCircleSolid : CheckCircleIcon}
                    onClick={handleTogglePlayed}
                    disabled={isTogglingPlayed}
                    isLoading={isTogglingPlayed}
                    variant="success"
                    tooltip={jamSong.played ? 'Mark as not played' : 'Mark as played'}
                    className={jamSong.played 
                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                      : 'hover:text-green-600 hover:bg-green-50'
                    }
                  />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-150 ease-in-out">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        <span>Edit song</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onRemove}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        <span>Remove from jam</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Middle Row: Artist and Meta Info */}
            <div className="mt-0 flex items-baseline justify-between gap-4 flex-wrap">
              <p className="text-md text-gray-500 font-medium">
                {song.artist}
              </p>
              {song.timesPlayed > 0 && (
                <div className="text-sm text-gray-400 space-x-4 shrink-0">
                  <span>
                    <span className="ml-1">Played{' '}</span>
                    <span className="text-gray-900">{song.timesPlayed} times</span>
                  </span>
                  <span>
                    <span className="ml-1">Last played on{' '}</span>
                    <span className="text-gray-900">
                      {new Date(song.lastPlayed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SongFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        initialData={song}
        onSubmit={handleEdit}
      />

      <CaptainTypeModal
        isOpen={isCaptaining}
        onClose={() => setIsCaptaining(false)}
        onSubmit={handleCaptainSubmit}
        songTitle={song.title}
      />
    </TooltipProvider>
  );
} 