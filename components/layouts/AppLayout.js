'use client';

import { MusicalNoteIcon, PlusIcon } from "@heroicons/react/24/outline";
import CreateJamModal from "../CreateJamModal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function AppLayout({ children }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const handleCreateJam = (newJam) => {
    setIsCreateModalOpen(false);
    router.push(`/jams/${newJam._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <MusicalNoteIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Music Jam</h1>
              </Link>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="secondary"
              className=""
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              New Jam
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <CreateJamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateJam={handleCreateJam}
      />
    </div>
  );
} 