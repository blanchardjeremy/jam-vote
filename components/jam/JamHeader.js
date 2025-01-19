import { MoreVertical } from 'lucide-react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJam } from '@/components/JamContext';

export default function JamHeader({ onDeleteClick }) {
  const { jam } = useJam();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
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
  );
} 