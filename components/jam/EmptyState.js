import { MusicalNoteIcon } from '@heroicons/react/24/solid';

export default function EmptyState() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-100">
              <MusicalNoteIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No songs yet - add some tunes!</h3>
            <p className="text-sm text-gray-500">
              Use the search bar at the top to add songs to your jam session.
              <br />
              You can search by title or artist name.
            </p>
          </div>
          <div className="pt-4">
            <div className="inline-flex items-center text-sm text-gray-500">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
              </svg>
              Look up here to get started
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 