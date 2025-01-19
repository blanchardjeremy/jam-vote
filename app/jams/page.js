'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { TrashIcon } from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingBlock from "@/components/LoadingBlock";

export default function Home() {
  const router = useRouter();
  const [jams, setJams] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPastJams, setShowPastJams] = useState(false);

  const fetchJams = async () => {
    try {
      const res = await fetch('/api/jams');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch jams');
      }
      const data = await res.json();
      setJams(data);
    } catch (e) {
      setError(e.message);
      console.error('Error in Home component:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJams();
  }, []);

  const handleCreateJam = async (newJam) => {
    setIsModalOpen(false);
    router.push(`/${newJam._id}`);
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading jams</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <LoadingBlock />
    );
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const currentJams = jams.filter(jam => new Date(jam.jamDate) >= oneWeekAgo);
  const pastJams = jams.filter(jam => new Date(jam.jamDate) < oneWeekAgo);

  const JamList = ({ jams }) => (
    <ul className="divide-y divide-gray-200">
      {jams.map((jam) => (
        <li 
          key={jam._id} 
          className="hover:bg-gray-50"
        >
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div 
                className="flex-grow cursor-pointer"
                onClick={() => router.push(`/${jam._id}`)}
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {jam.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(jam.jamDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {jam.songs.length} songs
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Jam Sessions</h1>
      </div>

      {/* Current Jams */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        {currentJams.length > 0 ? (
          <JamList jams={currentJams} />
        ) : (
          <div className="px-4 py-4 text-sm text-gray-500">No upcoming jams scheduled</div>
        )}
      </div>

      {/* Past Jams */}
      {pastJams.length > 0 && (
        <div className="mt-4">
          {!showPastJams ? (
            <button
              onClick={() => setShowPastJams(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Show {pastJams.length} past jam{pastJams.length === 1 ? '' : 's'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Past Jams</span>
                <button
                  onClick={() => setShowPastJams(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <JamList jams={pastJams} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
