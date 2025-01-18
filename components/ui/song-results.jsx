import { cn } from "@/lib/utils";

export function SongResults({
  results = [],
  isLoading = false,
  onSelect,
  className,
  mode = 'inline', // 'inline' or 'popover'
  emptyMessage = "No songs found",
  headerMessage = "Does this song already exist? If so, don't re-add it!",
  isHighlightable = false
}) {
  if (!results.length && !isLoading) return null;

  const containerClasses = cn(
    "w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
    "animate-in fade-in-0 zoom-in-95",
    "max-h-[300px] overflow-y-auto",
    mode === 'popover' && "absolute z-50",
    mode === 'inline' && "mt-1",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="p-1">
        {headerMessage && (
          <div className="py-2 px-3 text-sm font-medium text-orange-600">
            {headerMessage}
          </div>
        )}
        {isLoading ? (
          <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2.5 text-sm outline-none text-muted-foreground">
            <div className="h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </div>
        ) : results.length === 0 ? (
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