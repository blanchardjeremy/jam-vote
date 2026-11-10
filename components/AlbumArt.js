import { useState } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// The art URLs we save name their size, so a small square can ask for a small
// file: iTunes ".../600x600bb.jpg" and Deezer ".../500x500-000000-80-0-0.jpg".
// Links pasted by hand are used as they are.
export function sizedArtworkUrl(url, px) {
  if (!url) return url;
  if (url.includes('mzstatic.com')) return url.replace(/\/\d+x\d+bb\./, `/${px}x${px}bb.`);
  if (url.includes('dzcdn.net')) return url.replace(/\/\d+x\d+-/, `/${px}x${px}-`);
  return url;
}

// A song's album cover in a square, or a music note on grey when it has none
// or the image fails to load, so rows and cards line up either way. Keyed by
// URL so a reused square never shows the last song's cover while the next loads.
export default function AlbumArt({ url, px = 120, lazy = false, className, iconClassName }) {
  const [failed, setFailed] = useState(null);
  const showArt = url && failed !== url;
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden bg-gray-100 ring-1 ring-black/5',
        className
      )}
    >
      {showArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={sizedArtworkUrl(url, px)}
          alt=""
          draggable={false}
          loading={lazy ? 'lazy' : undefined}
          decoding="async"
          onError={() => setFailed(url)}
          className="h-full w-full object-cover"
        />
      ) : (
        <MusicalNoteIcon aria-hidden className={cn('h-1/2 w-1/2 text-gray-300', iconClassName)} />
      )}
    </div>
  );
}
