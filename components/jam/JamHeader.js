import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Check } from 'lucide-react';
import { RectangleStackIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { TrashIcon, WrenchScrewdriverIcon, StarIcon } from '@heroicons/react/24/solid';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJam } from '@/components/JamContext';
import { buildQueue } from '@/lib/utils/guideQueue';
import { cn } from '@/lib/utils';

export default function JamHeader({ onDeleteClick, hostMode, setHostMode, showFavorites, setShowFavorites }) {
  const { jam } = useJam();

  // Songs this device hasn't answered yet, counted the same way the guided
  // picker builds its queue. Read after mount since it uses localStorage, and
  // again whenever the jam changes (new songs, votes from this list).
  const [songsLeft, setSongsLeft] = useState(null);
  useEffect(() => {
    setSongsLeft(buildQueue(jam.songs).length);
  }, [jam.songs]);
  const caughtUp = songsLeft === 0;

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
          {caughtUp ? (
            <Button variant="outline" asChild className="text-green-700">
              <Link href={`/${jam.slug}/guide`} title="You've answered every song. Open guided voting.">
                <CheckCircleIcon className="h-5 w-5" />
                Caught up
              </Link>
            </Button>
          ) : (
            <Button variant="primary" asChild>
              <Link
                href={`/${jam.slug}/guide`}
                aria-label={songsLeft ? `Guided voting, ${songsLeft} ${songsLeft === 1 ? 'song' : 'songs'} left` : undefined}
              >
                {/* On phones the count takes the icon's place, keeping the button narrow */}
                <RectangleStackIcon className={cn('h-5 w-5', songsLeft > 0 && 'hidden sm:block')} />
                Guided voting
                {songsLeft > 0 && (
                  <span className="-mr-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {songsLeft}
                  </span>
                )}
              </Link>
            </Button>
          )}
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
                onClick={() => setShowFavorites(!showFavorites)}
                role="menuitemcheckbox"
                aria-checked={showFavorites}
              >
                <StarIcon className="h-4 w-4 mr-2" />
                Include favorites
                {showFavorites && <Check className="h-4 w-4 ml-auto pl-1" aria-hidden />}
              </DropdownMenuItem>
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