import { Button } from "@/components/ui/button";
import { PlusIcon, MusicalNoteIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background wrapper */}
      <div className="absolute inset-0 -z-10">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-pink-500/30 animate-gradient-x" />
        
        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-transparent" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] opacity-[0.15]" />
      </div>

      <div className="relative text-center max-w-3xl mx-auto">
        <div className="mb-8 flex justify-center items-center gap-2">
          <MusicalNoteIcon className="h-16 w-16 text-indigo-600" />
          <SparklesIcon className="h-8 w-8 text-purple-500" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-4">
          CouchJams
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Turn your living room into a stage. Create jam sessions, share songs, and make music together.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/jams">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Start Jamming
            </Button>
          </Link>
          
          <Link href="/songs">
            <Button variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
              Browse Songs
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 text-left">
          <div className="p-6 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Host a Jam</h3>
            <p className="text-gray-600">Create your jam session, set the date, and invite fellow musicians to join the fun.</p>
          </div>
          
          <div className="p-6 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build the Playlist</h3>
            <p className="text-gray-600">Suggest songs, discover new tunes, and collaborate on the perfect setlist.</p>
          </div>
          
          <div className="p-6 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rock Together</h3>
            <p className="text-gray-600">Vote on the next song, track what's been played, and keep the music flowing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
