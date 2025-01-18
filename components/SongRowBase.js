import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function BaseSongRow({
  song,
  leftControl,
  rightActions,
  isSelected,
  isNext,
  hideType,
  additionalInfo,
  className
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        "border-2 border-transparent px-2 py-1 md:px-4 md:py-2",
        isNext && "border-primary/70 bg-primary/5",
        isSelected && "bg-primary/5",
        className
      )}>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Left Control (Heart/Checkbox) */}
          {leftControl}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Title, Type, and Buttons */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap flex-1">
                <h2 className={`text-base md:text-lg font-semibold ${isNext ? 'text-primary' : ''}`}>
                  {song.title}
                </h2>
                {!hideType && (
                  <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    song.type === 'banger' 
                      ? 'bg-banger text-banger-foreground' 
                      : 'bg-jam text-jam-foreground'
                  }`}>
                    {song.type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                {rightActions}
              </div>
            </div>
            
            {/* Middle Row: Artist and Meta Info */}
            <div className="mt-0 flex items-baseline justify-between gap-2 md:gap-4 flex-wrap">
              <p className="text-sm md:text-md text-muted-foreground font-medium">
                {song.artist}
              </p>

              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                {additionalInfo}
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
      </div>
    </TooltipProvider>
  );
} 