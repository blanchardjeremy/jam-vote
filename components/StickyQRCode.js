import { useState } from 'react';
import { QrCodeIcon, XMarkIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/solid';
import QRCode from './QRCode';
import { Button } from './ui/button';
import { getJamUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
export default function StickyQRCode({ jamSlug }) {
  const [isVisible, setIsVisible] = useState(false);
  const [size, setSize] = useState(150);
  const jamUrl = getJamUrl(jamSlug);
  const displayUrl = jamUrl.replace(/^https?:\/\//, '');

  const QR_SIZES = {
    compact: { pixels: 75, title: 'text-base', url: 'text-xs' },
    default: { pixels: 150, title: 'text-lg', url: 'text-sm' },
    large: { pixels: 250, title: 'text-xl', url: 'text-base' }
  };

  const sizeKeys = Object.keys(QR_SIZES);
  const currentSizeKey = sizeKeys.find(key => QR_SIZES[key].pixels === size);
  const currentSizeIndex = sizeKeys.indexOf(currentSizeKey);

  const increaseSize = () => {
    if (currentSizeIndex < sizeKeys.length - 1) {
      const nextSize = QR_SIZES[sizeKeys[currentSizeIndex + 1]];
      setSize(nextSize.pixels);
    }
  };

  const decreaseSize = () => {
    if (currentSizeIndex > 0) {
      const prevSize = QR_SIZES[sizeKeys[currentSizeIndex - 1]];
      setSize(prevSize.pixels);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isVisible ? (
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center space-y-2">
          <p className={cn(`${QR_SIZES[currentSizeKey].title} tracking-wide text-primary rotate-[-2deg] font-extrabold`)}>
            Scan to vote!
          </p>
          <QRCode url={jamUrl} size={size} />
          <p className={`font-mono ${QR_SIZES[currentSizeKey].url} text-muted-foreground break-all text-center max-w-[200px]`}>
            {displayUrl}
          </p>
          <div className="flex gap-2 justify-end w-full">
            <Button
              onClick={decreaseSize}
              disabled={currentSizeIndex === 0}
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-secondary/80"
            >
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={increaseSize}
              disabled={currentSizeIndex === sizeKeys.length - 1}
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-secondary/80"
            >
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-secondary/80"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full shadow-lg"
        >
          <QrCodeIcon className="h-5 w-5 md:mr-2" />
          <span className="hidden md:block">Show QR Code</span>
        </Button>
      )}
    </div>
  );
} 