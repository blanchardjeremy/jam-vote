import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import SongRowButton from "@/components/SongRowButton";

export default function SongChordsButton({ song }) {
  if (song.title === "All My Life") console.log(song);
  if (!song.chordChart) {
    return null;
  }

  return (
    <SongRowButton
      icon={MusicalNoteIcon}
      href={song.chordChart}
      tooltip="View chords & lyrics"
    />
  );
} 