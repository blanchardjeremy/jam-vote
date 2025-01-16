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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleTogglePlayed = useCallback(async () => {
      await onTogglePlayed(jamSong._id);
  }, [jamSong._id, jamSong.played, onTogglePlayed]);
  
  const handleEdit = async (updatedSong) => {
    onEdit?.(jamSong._id, updatedSong);
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(`border-2 border-transparent px-2 py-2 md:px-4 md:py-4 ${
        jamSong.played ? 'bg-gray-200 opacity-50' : ''
      } ${
        isNext ? 'border-primary/70 bg-primary/5' : ''
      }`)}>
        <div className={`flex items-start gap-2 md:gap-4 text-played-foreground`}>
          {/* Vote Button */}
          <SongVotingButton jamSong={jamSong} onVote={onVote} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Title, Type, and Buttons */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap flex-1">
                <h2 className={`text-base md:text-lg font-semibold ${isNext ? 'text-primary' : ''}`}>
                  {song.title}
                </h2>
                {!hideType && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    song.type === 'banger' 
                      ? 'bg-banger text-banger-foreground' 
                      : 'bg-jam text-jam-foreground'
                  }`}>
                    {song.type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <SongRowButtonToolbar
                  song={song}
                  jamSong={jamSong}
                  handleTogglePlayed={handleTogglePlayed}
                  setIsEditModalOpen={setIsEditModalOpen}
                  onRemove={onRemove}
                />
              </div>
            </div>
            
            {/* Middle Row: Artist and Meta Info */}
            <div className="mt-1 flex items-baseline justify-between gap-2 md:gap-4 flex-wrap">
              <p className="text-sm md:text-md text-muted-foreground font-medium">
                {song.artist}
              </p>

              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <CaptainBadges jamSong={jamSong} isNext={isNext} />
                {song.timesPlayed > 0 && (
                  <div className="hidden sm:block text-xs md:text-sm text-muted-foreground space-x-2 md:space-x-4">
                    <span>
                      <span className="ml-1">Played{' '}</span>
                      <span className="text-foreground">{song.timesPlayed} times</span>
                    </span>
                    <span>
                      <span className="ml-1">Last played on{' '}</span>
                      <span className="text-foreground">
                        {new Date(song.lastPlayed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
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