import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import LoadingBlock from "@/components/LoadingBlock";
import { fetchJams } from '@/lib/services/jams';

export default function SelectJamModal({ isOpen, onClose, onSelect }) {
  const [jams, setJams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Lazy load jams when modal opens
  useEffect(() => {
    if (isOpen) {
      loadJams();
    }
  }, [isOpen]);

  const loadJams = async () => {
    try {
      const data = await fetchJams();
      setJams(data);
    } catch (e) {
      setError(e.message);
      console.error('Error loading jams:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jams based on search query
  const filteredJams = jams.filter(jam =>
    jam.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (jam) => {
    onSelect(jam);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Target Jam"
      description="Choose which jam session to add the selected songs to"
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="mb-4">
          <SearchInput
            placeholder="Search jams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : isLoading ? (
          <LoadingBlock />
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredJams.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4">No jams found</p>
            ) : (
              filteredJams.map((jam) => (
                <div
                  key={jam._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {jam.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(jam.jamDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelect(jam)}
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
} 