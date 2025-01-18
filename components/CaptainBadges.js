import { Badge } from "@/components/ui/badge";

export default function CaptainBadges({ jamSong, isNext }) {
  return (
    <div className="flex gap-1">
      {(jamSong.captains || []).map((captain, index) => (
        <Badge 
          key={`${captain.name}-${index}`}
          variant={isNext ? 'default' : 'secondary'}
          className="text-[10px] md:text-xs px-1.5 py-0 md:px-2 md:py-0.5"
        >
          {captain.name} {captain.type === 'piano' ? '🎹' : '🎤'}
        </Badge>
      ))}
    </div>
  );
} 