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
  const [jamToDelete, setJamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    router.push(`/jams/${newJam._id}`);
  };

  const handleDeleteJam = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/jams/${jamToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete jam');
      }
      
      // Remove the jam from the local state
      setJams(jams.filter(jam => jam._id !== jamToDelete._id));
      setJamToDelete(null);
    } catch (e) {
      setError(e.message);
      console.error('Error deleting jam:', e);
    } finally {
      setIsDeleting(false);
    }
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

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Jam Sessions</h1>
      </div>

      {/* Jams List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
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
                    onClick={() => router.push(`/jams/${jam._id}`)}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setJamToDelete(jam);
                      }}
                      aria-label={`Delete ${jam.name}`}
                    >
                      <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        isOpen={!!jamToDelete}
        onClose={() => setJamToDelete(null)}
        onConfirm={handleDeleteJam}
        description={`This will permanently delete the jam session "${jamToDelete?.name}". This action cannot be undone.`}
        isLoading={isDeleting}
        confirmText="Delete"
        confirmLoadingText="Deleting..."
      />
    </>
  );
}
