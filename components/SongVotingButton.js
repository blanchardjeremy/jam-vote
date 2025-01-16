import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useState, useCallback, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SongVotingButton({ jamSong, onVote }) {
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  // Determine which icon to show based on state
  const VoteIcon = hasVoted ? HeartSolid : HeartOutline;
  
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

  return (
    <div className="flex flex-col items-center pt-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleVote}
            disabled={isVoting}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'p-1 rounded-lg transition-all duration-150 ease-in-out',
              getVoteButtonStyles()
            )}
          >
            <VoteIcon className={cn('h-5 w-5', getVoteIconStyles())} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasVoted ? 'Remove vote' : 'Vote for this song'}</p>
        </TooltipContent>
      </Tooltip>
      <span className="text-sm font-medium text-gray-900">{jamSong.votes}</span>
    </div>
  );
} 