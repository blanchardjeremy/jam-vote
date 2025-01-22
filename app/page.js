import { Button } from "@/components/ui/button";
import { Music, Users, ListMusic, ThumbsUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white py-6 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <Music className="h-16 w-16 text-purple-300 mx-auto" />
        </div>
        <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">JamVote</h1>
        <p className="text-2xl text-purple-200">Host live music jams and vote on what to play next.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 max-w-4xl mx-auto">
        <Link href="/4" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-gray-100 text-purple-900 rounded-lg px-8 py-3 text-lg font-medium">
            See Demo Jam
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        
        <Link href="/jams" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white hover:border-white/80 rounded-lg px-8 py-3 text-lg font-medium">
            Browse Jams
          </Button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-purple-800 bg-opacity-30 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Music className="w-8 h-8 mr-3 text-purple-300" />
            <h2 className="text-xl font-semibold">Host a Jam</h2>
          </div>
          <p>Create your jam session and invite friends to join the fun</p>
        </div>
        
        <div className="bg-purple-800 bg-opacity-30 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <ListMusic className="w-8 h-8 mr-3 text-purple-300" />
            <h2 className="text-xl font-semibold">Build the Playlist</h2>
          </div>
          <p>Suggest songs and collaborate on the perfect setlist</p>
        </div>
        
        <div className="bg-purple-800 bg-opacity-30 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <ThumbsUp className="w-8 h-8 mr-3 text-purple-300" />
            <h2 className="text-xl font-semibold">Vote Together</h2>
          </div>
          <p>Choose the next song and keep the music flowing</p>
        </div>
        
        <div className="bg-purple-800 bg-opacity-30 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Users className="w-8 h-8 mr-3 text-purple-300" />
            <h2 className="text-xl font-semibold">Rock Out</h2>
          </div>
          <p>Turn your living room into an instant concert venue</p>
        </div>
      </div>
    </div>
  );
}
