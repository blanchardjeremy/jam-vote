import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RectangleStackIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJam } from '@/components/JamContext';
import { buildQueue } from '@/lib/utils/guideQueue';

// Shared look for the jam's main action buttons (Add Songs, Guided voting):
// a purple outline, quieter than a solid button
export const jamActionButtonClass =
  'h-11 rounded-full border-primary bg-white text-primary hover:bg-primary/5 hover:text-primary';

// Opens guided voting, with how many songs this device still has to answer
export default function GuidedVotingButton({ className }) {
  const { jam } = useJam();

  // Songs this device hasn't answered yet, counted the same way the guided
  // picker builds its queue. Read after mount since it uses localStorage, and
  // again whenever the jam changes (new songs, votes from this list).
  const [songsLeft, setSongsLeft] = useState(null);
  useEffect(() => {
    setSongsLeft(buildQueue(jam.songs).length);
  }, [jam.songs]);

  if (songsLeft === 0) {
    return (
      <Button variant="outline" asChild className={cn(jamActionButtonClass, 'border-green-600 text-green-700 hover:bg-green-50 hover:text-green-700', className)}>
        <Link href={`/${jam.slug}/guide`} title="You've answered every song. Open guided voting.">
          <CheckCircleIcon className="h-5 w-5" />
          Caught up
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" asChild className={cn(jamActionButtonClass, className)}>
      <Link
        href={`/${jam.slug}/guide`}
        aria-label={songsLeft ? `Guided voting, ${songsLeft} ${songsLeft === 1 ? 'song' : 'songs'} left` : undefined}
      >
        <RectangleStackIcon className="h-5 w-5" />
        {/* No count badge: "Not voted (N)" beside it shows the same number */}
        Guided voting
      </Link>
    </Button>
  );
}
