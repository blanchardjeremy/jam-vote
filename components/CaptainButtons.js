import { useState, useEffect } from "react";
import { MicVocal, Piano } from "lucide-react";
import { toast } from "sonner";
import SongRowButton from "@/components/SongRowButton";
import CaptainNameModal from "@/components/CaptainNameModal";
import { useJam } from "@/components/JamContext";
import { cn } from "@/lib/utils";

// Lucide's mic and piano, drawn at Heroicons' outline stroke width so they
// match the other row buttons. Same symbols as the 🎤 / 🎹 captain badges.
const MicIcon = (props) => <MicVocal strokeWidth={1.5} {...props} />;
const PianoIcon = (props) => <Piano strokeWidth={1.5} {...props} />;

const TYPES = {
  regular: { icon: MicIcon, label: 'captain' },
  piano: { icon: PianoIcon, label: 'piano captain' },
};

// Two buttons on each jam song: sign up as captain, or as piano captain.
// Tap again to step down. Each person has one captain spot per song, so
// tapping the other button switches between captain and piano.
export default function CaptainButtons({ jamSong }) {
  const { jam } = useJam();
  // Your captain type on this song ('regular' | 'piano'), or null
  const [myType, setMyType] = useState(null);
  const [busy, setBusy] = useState(false);
  // The type picked before we knew your name
  const [pendingType, setPendingType] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem('userFirstName');
    const mine = name && (jamSong.captains || []).find((c) => c.name === name);
    setMyType(mine ? mine.type || 'regular' : null);
  }, [jamSong.captains]);

  const request = async (method, url, body) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Something went wrong');
    }
  };
  const remove = (name) =>
    request('DELETE', `/api/jams/${jam._id}/captain?songId=${jamSong._id}&name=${encodeURIComponent(name)}`);
  const signUp = (name, type) =>
    request('POST', `/api/jams/${jam._id}/captain`, { name, type, songId: jamSong._id });

  const toggle = async (type, name) => {
    setBusy(true);
    try {
      if (myType === type) {
        await remove(name);
        setMyType(null);
        toast.success(`You're no longer ${TYPES[type].label} on ${jamSong.song.title}`);
      } else {
        // Switching from the other type: give up that spot first
        if (myType) await remove(name);
        await signUp(name, type);
        setMyType(type);
        toast.success(`You're ${TYPES[type].label} on ${jamSong.song.title}`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClick = (type) => {
    const name = localStorage.getItem('userFirstName');
    if (!name) {
      // First time only: ask for a first name, then sign up
      setPendingType(type);
      return;
    }
    toggle(type, name);
  };

  return (
    <>
      {Object.entries(TYPES).map(([type, { icon, label }]) => {
        const active = myType === type;
        return (
          <SongRowButton
            key={type}
            icon={icon}
            onClick={() => handleClick(type)}
            disabled={jamSong.played || busy}
            tooltip={
              jamSong.played
                ? `Can't sign up for a played song`
                : active
                  ? `Stop being ${label}`
                  : `Sign up as ${label}`
            }
            className={cn(
              'hover:text-indigo-600 hover:bg-indigo-50',
              active && 'bg-indigo-50 text-indigo-600'
            )}
          />
        );
      })}

      <CaptainNameModal
        isOpen={!!pendingType}
        onClose={() => setPendingType(null)}
        onSubmit={(name) => {
          const type = pendingType;
          setPendingType(null);
          if (type) toggle(type, name);
        }}
      />
    </>
  );
}
