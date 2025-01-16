import { MusicalNoteIcon, PlusIcon } from "@heroicons/react/24/outline";
import CreateJamModal from "./CreateJamModal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";

export default function Layout({ children }) {
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
              <MusicalNoteIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <Link href="/"><h1 className="text-2xl font-bold text-gray-900">Music Jam</h1></Link>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="default"
              className="inline-flex items-center gap-x-2"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              New Jam Session
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
