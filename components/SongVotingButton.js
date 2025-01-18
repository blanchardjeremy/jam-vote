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
    // Check localStorage on mount and when jamSong changes
    const voted = localStorage.getItem(`vote-${jamSong._id}`);
    setHasVoted(voted === 'true');
  }, [jamSong]);

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
      return 'text-primary/60 pointer-events-none';
    }
    
    if (hasVoted) {
      return 'text-primary hover:text-primary/80 hover:bg-primary/5';
    }
    
    return 'text-primary/60 hover:text-primary hover:bg-primary/5';
  }
  
  function getVoteIconStyles() {
    if (jamSong.played) {
      return 'text-primary/60';
    }
    
    if (hasVoted) {
      return isHovered ? 'text-primary/80' : 'text-primary';
    }
    
    return isHovered ? 'text-primary' : 'text-primary/60';
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleVote}
          disabled={isVoting}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'flex flex-col items-center p-0 px-2 rounded-lg transition-all duration-150 ease-in-out z-0',
            getVoteButtonStyles()
          )}
        >
          <VoteIcon className={cn('h-6 w-6 md:h-7 md:w-7', getVoteIconStyles())} />
          <span className="text-xs md:text-sm font-medium text-primary">{jamSong.votes}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hasVoted ? 'Remove vote' : 'Vote for this song'}</p>
      </TooltipContent>
    </Tooltip>
  );
} 