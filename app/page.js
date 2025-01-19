import { Button } from "@/components/ui/button";
import { PlusIcon, MusicalNoteIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Full-width background */}
      <div className="fixed inset-0 bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-white/90 via-white/60 to-white/30" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.07] bg-[length:24px_24px] [background-image:linear-gradient(to_right,#666_1px,transparent_1px),linear-gradient(to_bottom,#666_1px,transparent_1px)]" />
      </div>

      {/* Content */}
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8 flex justify-center items-center gap-2">
            <MusicalNoteIcon className="h-16 w-16 text-indigo-600" />
            <SparklesIcon className="h-8 w-8 text-purple-500" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-4">
            Jam Vote
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
    </>
  );
}
