import { MusicalNoteIcon } from '@heroicons/react/24/solid';

export default function JamEmptyState() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
      {/* Search arrow indicator */}
      <div className="relative">
        <div className="absolute left-12 top-4">
          <div className="flex flex-col items-center w-fit bg-primary rounded-lg shadow-lg p-3 pt-5 transform -translate-y-1">
            <svg 
              className="w-8 h-8 text-white animate-bounce"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 10l7-7m0 0l7 7m-7-7v18" 
              />
            </svg>
            <span className="text-sm font-medium text-white whitespace-nowrap mt-1">
              Search here to add songs
            </span>
          </div>
        </div>
      </div>

      {/* Main empty state content */}
      <div className="flex flex-col items-center py-8 px-4 sm:py-16 mt-24">
        <div className="flex flex-col items-center space-y-6 w-full max-w-sm">

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No songs yet - add some tunes!</h3>
            <p className="text-base text-gray-600">
              Use the search bar above to find and add songs to your jam session. Search by title or artist name.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 