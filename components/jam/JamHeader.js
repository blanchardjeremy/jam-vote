import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJam } from '@/components/JamContext';

export default function JamHeader({ onDeleteClick, hostMode, setHostMode }) {
  const { jam } = useJam();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{jam.name}</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">
              {new Date(jam.jamDate).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" asChild>
            <Link href={`/${jam.slug}/guide`}>
              <RectangleStackIcon className="h-5 w-5" />
              Guided voting
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open jam options"
              >
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setHostMode(!hostMode)}>
                <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                {hostMode ? 'Disable' : 'Enable'} Host Tools
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={onDeleteClick}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Jam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 