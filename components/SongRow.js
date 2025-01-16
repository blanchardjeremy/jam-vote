import { useState, useCallback } from "react";
import {
  TooltipProvider
} from "@/components/ui/tooltip";
import SongFormModal from "@/components/AddSongModal";
import { cn } from "@/lib/utils";
import { useParams } from 'next/navigation';
import SongRowButtonToolbar from "@/components/SongRowButtonToolbar";
import SongVotingButton from "@/components/SongVotingButton";
import CaptainBadges from "@/components/CaptainBadges";

export default function SongRow({ jamSong, onVote, onRemove, onTogglePlayed, onEdit, isNext, hideType }) {
  const { song } = jamSong;
  const [isTogglingPlayed, setIsTogglingPlayed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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
  
  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(` border-2 border-transparent px-4 py-4 sm:px-6 ${jamSong.played ? 'bg-gray-100' : ''} ${
        isNext ? ' border-indigo-400 bg-indigo-50/50 ' : ''
      }`)}>
        <div className={`flex items-start gap-4 ${jamSong.played ? 'opacity-40' : ''}`}>
          {/* Vote Button */}
          <SongVotingButton jamSong={jamSong} onVote={onVote} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Title, Type, and Buttons */}
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
                <CaptainBadges jamSong={jamSong} />
              </div>
              <div className="flex items-center gap-2">
                <SongRowButtonToolbar
                  song={song}
                  jamSong={jamSong}
                  handleTogglePlayed={handleTogglePlayed}
                  isTogglingPlayed={isTogglingPlayed}
                  setIsEditModalOpen={setIsEditModalOpen}
                  onRemove={onRemove}
                />
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

        {/* Modals */}
        <SongFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEdit}
          initialData={song}
          mode="edit"
        />
      </div>
    </TooltipProvider>
  );
} 