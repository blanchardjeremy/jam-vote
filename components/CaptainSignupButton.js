import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon as UserIconOutline } from "@heroicons/react/24/outline";
import { UserIcon as UserIconSolid } from "@heroicons/react/24/solid";

export default function CaptainSignupButton({ jamId, onSignup, isCaptain }) {
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

  const Icon = isCaptain ? UserIconSolid : UserIconOutline;

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Icon className="h-4 w-4" />
            {isCaptain ? 'Captain Settings' : 'Sign Up as Song Captain'}
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
    </>
  );
} 