import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { TrashIcon, PencilIcon, EllipsisHorizontalIcon, UserIcon as UserIconOutline } from "@heroicons/react/24/outline";
import { UserIcon as UserIconSolid } from "@heroicons/react/24/solid";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
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
import CaptainNameModal from "@/components/CaptainNameModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useParams } from 'next/navigation';
import { pusherClient } from "@/lib/pusher";
import { toast } from "sonner";


export default function SongRow({ jamSong, onVote, onRemove, onTogglePlayed, onEdit, isNext, hideType }) {
  const params = useParams();
  const { song } = jamSong;
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTogglingPlayed, setIsTogglingPlayed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isCaptainLoading, setIsCaptainLoading] = useState(false);
  const [captainDropdownOpen, setCaptainDropdownOpen] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);
  const [captains, setCaptains] = useState(jamSong.captains || []);
  
  useEffect(() => {
    // Check localStorage on mount
    const voted = localStorage.getItem(`vote-${jamSong._id}`);
    setHasVoted(voted === 'true');

    // Check if user is a captain for this song
    const userName = localStorage.getItem('userFirstName');
    if (userName && jamSong.captains) {
      setIsCaptain(jamSong.captains.some(captain => captain.name === userName));
    }

    // Initialize captains state
    setCaptains(jamSong.captains || []);

    // Set up Pusher subscription
    const channelName = `jam-${params.id}`;
    const channel = pusherClient.subscribe(channelName);

    // Handle captain updates
    channel.bind('captain-added', (data) => {
      if (data.songId === jamSong._id) {
        // Only add the captain if they're not already in the list
        setCaptains(prevCaptains => {
          const captainExists = prevCaptains.some(c => 
            c.name === data.captain.name && c.type === data.captain.type
          );
          if (captainExists) return prevCaptains;
          return [...prevCaptains, data.captain];
        });
        
        // Check if the current user is the new captain
        const userName = localStorage.getItem('userFirstName');
        if (userName && data.captain.name === userName) {
          setIsCaptain(true);
        }
      }
    });

    return () => {
      channel.unbind('captain-added');
    };
  }, [jamSong._id, jamSong.captains, params.id]);
  
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
  
  const handleCaptainClick = () => {
    // Don't open dropdown if already a captain
    if (isCaptain) {
      toast.info('You are already a captain for this song');
      return;
    }
    setCaptainDropdownOpen(true);
  };

  const handleTypeSelect = async (type) => {
    setCaptainDropdownOpen(false);
    const userName = localStorage.getItem('userFirstName');
    
    if (!userName) {
      setShowNameModal(true);
      // Store the selected type to use after name input
      localStorage.setItem('pendingCaptainType', type);
    } else {
      await handleCaptainSubmit(type, userName);
    }
  };

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
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign up as captain');
      }

      const data = await response.json();
      // Optimistically update UI immediately
      const newCaptain = data.captain;
      setIsCaptain(true);
      setCaptains(prevCaptains => [...prevCaptains, newCaptain]);
      toast.success('Successfully signed up as captain!');
    } catch (error) {
      console.error('Error signing up as captain:', error);
      toast.error(error.message);
    } finally {
      setIsCaptainLoading(false);
      localStorage.removeItem('pendingCaptainType');
    }
  };

  const handleNameSubmit = (name) => {
    const type = localStorage.getItem('pendingCaptainType');
    if (type) {
      handleCaptainSubmit(type, name);
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
                {captains.map((captain, index) => (
                  <Badge 
                    key={`${captain.name}-${index}`}
                    variant={captain.type === 'piano' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {captain.name} ({captain.type === 'piano' ? '🎹' : '🎸'})
                  </Badge>
                ))}
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
                  <DropdownMenu 
                    open={captainDropdownOpen} 
                    onOpenChange={setCaptainDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <div>
                        <SongRowButton
                          icon={isCaptain ? UserIconSolid : UserIconOutline}
                          onClick={handleCaptainClick}
                          disabled={jamSong.played || isCaptainLoading || isCaptain}
                          isLoading={isCaptainLoading}
                          tooltip={
                            jamSong.played 
                              ? 'Cannot captain a played song' 
                              : isCaptain 
                                ? 'You are already a captain for this song'
                                : 'Sign up to captain'
                          }
                          className={cn(
                            "hover:text-indigo-600 hover:bg-indigo-50",
                            isCaptain && "text-indigo-600"
                          )}
                        />
                      </div>
                    </DropdownMenuTrigger>
                    {!isCaptain && (
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleTypeSelect('regular')}>
                          Regular Captain
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTypeSelect('piano')}>
                          Piano Captain
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
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

      <CaptainNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSubmit={handleNameSubmit}
      />
    </TooltipProvider>
  );
} 