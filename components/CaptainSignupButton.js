import { useState, useEffect } from "react";
import { UserIcon as UserIconOutline } from "@heroicons/react/24/outline";
import { UserIcon as UserIconSolid } from "@heroicons/react/24/solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SongRowButton from "@/components/SongRowButton";
import { cn } from "@/lib/utils";
import { useParams } from 'next/navigation';
import { toast } from "sonner";
import CaptainNameModal from "@/components/CaptainNameModal";
import { useJam } from "@/components/JamContext";

export default function CaptainSignupButton({ jamSong }) {
  const params = useParams();
  const { jam } = useJam();
  const [isCaptainLoading, setIsCaptainLoading] = useState(false);
  const [captainDropdownOpen, setCaptainDropdownOpen] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    // Check if user is a captain for this song
    const userName = localStorage.getItem('userFirstName');
    if (userName && jamSong.captains) {
      setIsCaptain(jamSong.captains.some(captain => captain.name === userName));
    }
  }, [jamSong.captains]);

  const handleCaptainClick = async () => {
    // If already a captain, remove them
    if (isCaptain) {
      setIsCaptainLoading(true);
      try {
        const userName = localStorage.getItem('userFirstName');
        console.log('[Captain Remove] Attempting to remove captain:', { userName, songId: jamSong._id });
        
        const response = await fetch(
          `/api/jams/${jam._id}/captain?songId=${jamSong._id}&name=${encodeURIComponent(userName)}`, 
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to remove as captain');
        }

        setIsCaptain(false);
        toast.success('Successfully removed as captain');
      } catch (error) {
        console.error('[Captain Remove] Error:', error);
        toast.error(error.message);
      } finally {
        setIsCaptainLoading(false);
      }
      return;
    }

    // Otherwise open dropdown for signup
    setCaptainDropdownOpen(true);
  };

  const handleTypeSelect = async (type) => {
    setCaptainDropdownOpen(false);
    const userName = localStorage.getItem('userFirstName');
    
    if (!userName) {
      setShowNameModal(true);
      // Store the selected type to use after name input
      localStorage.setItem('pendingCaptainType', type);
    } else {
      await handleCaptainSubmit(type, userName);
    }
  };

  const handleCaptainSubmit = async (type, name) => {
    if (isCaptainLoading) return;

    setIsCaptainLoading(true);
    try {
      const response = await fetch(`/api/jams/${jam._id}/captain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          songId: jamSong._id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign up as captain');
      }

      const data = await response.json();
      setIsCaptain(true);
      toast.success('You are now a song captain!');
    } catch (error) {
      console.error('Error signing up as captain:', error);
      toast.error(error.message);
    } finally {
      setIsCaptainLoading(false);
      localStorage.removeItem('pendingCaptainType');
    }
  };

  const handleNameSubmit = (name) => {
    const type = localStorage.getItem('pendingCaptainType');
    if (type) {
      handleCaptainSubmit(type, name);
    }
  };

  return (
    <>
      <DropdownMenu 
        open={captainDropdownOpen && !jamSong.played} 
        onOpenChange={(open) => !jamSong.played && setCaptainDropdownOpen(open)}
      >
        <DropdownMenuTrigger asChild>
          <div className="inline-flex">
            <SongRowButton
              icon={isCaptain ? UserIconSolid : UserIconOutline}
              onClick={() => setCaptainDropdownOpen(true)}
              disabled={jamSong.played || isCaptainLoading}
              isLoading={isCaptainLoading}
              tooltip={
                jamSong.played 
                  ? 'Cannot captain a played song' 
                  : isCaptain 
                    ? 'Captain options'
                    : 'Sign up to captain'
              }
              className={cn(
                "hover:text-indigo-600 hover:bg-indigo-50",
                isCaptain && "text-indigo-600"
              )}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {isCaptain ? (
            <DropdownMenuItem onClick={handleCaptainClick} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              Remove me as captain
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => handleTypeSelect('regular')}>
                🎤 Sign up as regular captain
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeSelect('piano')}>
                🎹 Sign up as piano captain
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CaptainNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSubmit={handleNameSubmit}
      />
    </>
  );
} 