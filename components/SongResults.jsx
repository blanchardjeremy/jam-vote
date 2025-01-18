import { cn } from "@/lib/utils";
import LoadingBlock from "@/components/LoadingBlock";

export function SongResults({
  results = [],
  isLoading = false,
  onSelect,
  className,
  maxResults = 5,
  emptyMessage = "No songs found",
  header,
  isHighlightable = true
}) {
  if (!results.length && !isLoading) return null;

  if (isLoading) return null;

  return (
    <div className={cn(
      "w-full",
      "max-h-[300px] overflow-y-auto",
      className
    )}>
      <div className="p-1">
        {header}
        {results.length === 0 ? (
          <div className="relative flex cursor-default select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          results.map((song) => (
            <div
              key={song._id}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm",
                isHighlightable && !song.disabled && [
                  "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  "transition-colors duration-100"
                ],
                song.disabled && "opacity-50"
              )}
              onClick={() => {
                if (isHighlightable && !song.disabled && onSelect) {
                  onSelect(song);
                }
              }}
            >
              <div>
                <span className="font-medium">{song.title}</span>
                <span className="ml-2 text-muted-foreground">{song.artist}</span>
                {song.disabled && (
                  <span className="ml-2 text-sm text-muted-foreground font-medium">
                    (Already added)
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  song.type === 'banger'
                    ? 'bg-banger text-banger-foreground'
                    : 'bg-jam text-jam-foreground'
                )}
              >
                {song.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 