'use client';

import { useState, useEffect } from 'react';
import SongListRow from "@/components/SongListRow";
import Loading from "@/app/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TrashIcon } from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog";
import { fetchSongs, useSongOperations, createSong } from '@/lib/services/songs';
import ImportSongsModal from "@/components/ImportSongsModal";
import SongAutocomplete from "@/components/SongAutocomplete";

export default function SongsPage() {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Get song operations from our service
  const { handleEdit, handleDelete, handleBulkDelete } = useSongOperations({
    songs,
    setSongs,
    selectedSongs,
    setSelectedSongs,
    onSuccess: null,
    onError: null
  });

  const loadSongs = async () => {
    try {
      const data = await fetchSongs();
      setSongs(data);
    } catch (e) {
      setError(e.message);
      console.error('Error fetching songs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await handleBulkDelete(selectedSongs);
      setShowDeleteDialog(false);
      // Reset selection after successful delete
      setSelectedSongs(new Set());
      setLastClickedIndex(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (songId, currentIndex) => {
    console.log('Toggle Selection:', { songId, currentIndex, lastClickedIndex, isShiftPressed });

    if (isShiftPressed && lastClickedIndex !== null) {
      // Handle shift-click range selection
      const start = Math.min(lastClickedIndex, currentIndex);
      const end = Math.max(lastClickedIndex, currentIndex);
      const rangeIds = filteredSongs.slice(start, end + 1).map(song => song._id);

      console.log('Shift-click range:', { start, end, rangeIds });

      setSelectedSongs(prev => {
        const next = new Set(prev);
        rangeIds.forEach(id => next.add(id));
        return next;
      });
    } else {
      // Normal toggle behavior
      setSelectedSongs(prev => {
        const next = new Set(prev);
        if (next.has(songId)) {
          next.delete(songId);
        } else {
          next.add(songId);
        }
        return next;
      });
      // Update last clicked index for future shift-clicks
      setLastClickedIndex(currentIndex);
    }
  };

  const toggleAllSelection = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map(song => song._id)));
    }
    setLastClickedIndex(null);
  };

  const handleAddNewSong = async (songData) => {
    try {
      const newSong = await createSong(songData);
      setSongs(prev => [...prev, newSong]);
    } catch (error) {
      console.error('Error adding song:', error);
      // You might want to show a toast notification here
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive-foreground">Error loading songs</h3>
            <div className="mt-2 text-sm text-destructive-foreground">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  // Filter songs based on type
  const filteredSongs = songs.filter(song => 
    filterType === 'all' ? true : song.type === filterType
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Songs</h1>
        <p className="text-gray-600 mt-2">
          {songs.length} songs in the library
        </p>
      </div>

      {/* Song Search and Add */}
      <div className="mb-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Add a Song</h2>
        <SongAutocomplete
          onSelect={(song) => handleAddNewSong(song)}
          onAddNew={(title) => handleAddNewSong({ title, type: 'banger' })}
          currentSongs={songs}
          maxWidth="max-w-xl"
          placeholder="Check if song exists before adding..."
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10">
        <div className="mb-4 flex items-center justify-between bg-background shadow-sm rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedSongs.size === filteredSongs.length && filteredSongs.length > 0}
              onCheckedChange={toggleAllSelection}
              aria-label="Select all songs"
            />

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All songs</SelectItem>
                <SelectItem value="banger">Bangers</SelectItem>
                <SelectItem value="ballad">Ballads</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={selectedSongs.size === 0 ? "outline-destructive" : "destructive"}
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || selectedSongs.size === 0}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : selectedSongs.size === 0 ? 'Delete' : `Delete ${selectedSongs.size} selected`}
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="ml-4"
            >
              Import CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Songs list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {filteredSongs.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 italic">
              No songs found
            </li>
          ) : (
            filteredSongs.map((song, index) => (
              <li key={song._id} className="hover:bg-gray-50">
                <SongListRow 
                  song={song}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isSelected={selectedSongs.has(song._id)}
                  onSelectionChange={(checked, event) => toggleSelection(song._id, index)}
                  hideType={filterType !== 'all'}
                />
              </li>
            ))
          )}
        </ul>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Songs"
        description={`Are you sure you want to delete ${selectedSongs.size} songs? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Songs'}
        cancelText="Cancel"
        disabled={isDeleting}
      />

      <ImportSongsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadSongs}
        allSongs={songs}
      />
    </div>
  );
} 