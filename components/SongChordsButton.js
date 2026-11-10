import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import SongRowButton from "@/components/SongRowButton";

// The song's own chord chart, or an Ultimate Guitar search for it
export function chordUrl(song) {
  if (song.chordChart) {
    return song.chordChart;
  }
  const searchQuery = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://ultimate-tab.com/search?type=Chords&q=${searchQuery}`;
}

export default function SongChordsButton({ song }) {
  return (
    <SongRowButton
      icon={MusicalNoteIcon}
      href={chordUrl(song)}
      tooltip="View chords & lyrics"
    />
  );
} 