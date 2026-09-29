import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import SongRowButton from "@/components/SongRowButton";

export default function SongChordsButton({ song }) {
  const getChordUrl = () => {
    if (song.chordChart) {
      return song.chordChart;
    }
    
    // Generate search URL with song title and artist
    const searchQuery = encodeURIComponent(`${song.title} ${song.artist}`);
    return `https://ultimate-tab.com/search?type=Chords&q=${searchQuery}`;
  };

  return (
    <SongRowButton
      icon={MusicalNoteIcon}
      href={getChordUrl()}
      tooltip="View chords & lyrics"
    />
  );
} 