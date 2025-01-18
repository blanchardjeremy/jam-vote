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
  const [showRainbow, setShowRainbow] = useState(jamSong.showRainbowHeart);

  useEffect(() => {
    setShowRainbow(jamSong.showRainbowHeart);
  }, [jamSong.showRainbowHeart]);

  useEffect(() => {
    const handleClearRainbow = (e) => {
      if (e.detail.songId === jamSong._id) {
        setShowRainbow(false);
      }
    };

    window.addEventListener('clearRainbowHeart', handleClearRainbow);
    return () => window.removeEventListener('clearRainbowHeart', handleClearRainbow);
  }, [jamSong._id]);

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
      setShowRainbow(true);
    } else {
      localStorage.removeItem(`vote-${jamSong._id}`);
      setShowRainbow(false);
    }
    
    try {
      const action = newVoteState ? 'vote' : 'unvote';
      await onVote(jamSong._id, action);
    } catch (error) {
      // Revert optimistic updates on error
      setHasVoted(!newVoteState);
      setShowRainbow(false);
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
  }, [hasVoted, isVoting, jamSong._id, onVote]);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleVote}
            className={cn(
              "transition-colors",
              hasVoted ? "text-red-500" : "text-gray-400 hover:text-red-500"
            )}
            disabled={isVoting}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {showRainbow ? (
              <HeartSolid 
                className={cn(
                  "h-5 w-5 relative z-10",
                  "animate-rainbow-shift"
                )} 
              />
            ) : hasVoted ? (
              <HeartSolid 
                className="h-5 w-5 relative z-10 text-red-500"
              />
            ) : (
              <HeartOutline 
                className="h-5 w-5"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasVoted ? 'Remove vote' : 'Vote for this song'}</p>
        </TooltipContent>
      </Tooltip>
      <span className="min-w-[2ch] text-sm">{jamSong.votes}</span>
    </div>
  );
} 