import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon } from "@heroicons/react/24/outline";
import CaptainSignupModal from './CaptainSignupModal';

export default function CaptainSignupButton({ jamId, onSignup }) {
  const [showModal, setShowModal] = useState(false);
  const [captainType, setCaptainType] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [captainName, setCaptainName] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem('captainName');
    if (storedName) {
      setCaptainName(storedName);
    }
  }, []);

  const handleTypeSelect = async (type) => {
    setCaptainType(type);
    
    if (!captainName) {
      setShowModal(true);
      return;
    }

    await handleSignup(captainName, type);
  };

  const handleSignup = async (name, type) => {
    try {
      const response = await fetch(`/api/jams/${jamId}/captain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign up as captain');
      }

      const data = await response.json();
      onSignup?.(data);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error signing up as captain:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <UserIcon className="h-4 w-4" />
            Sign Up as Captain
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleTypeSelect('regular')}>
            Regular Captain
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTypeSelect('piano')}>
            Piano Captain
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CaptainSignupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(name) => handleSignup(name, captainType)}
      />
    </>
  );
} 