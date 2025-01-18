'use client';

import { useState, useEffect } from 'react';
import SongListRow from "@/components/SongRowList";
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
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog";
import { fetchSongs, useSongOperations, createSong } from '@/lib/services/songs';
import { addSongsToJam } from '@/lib/services/jams';
import ImportSongsModal from "@/components/ImportSongsModal";
import { SearchInput } from "@/components/ui/search-input";
import AddSongToTargetJamButton from "@/components/AddSongToTargetJamButton";

// New SongTypeFilter component
function SongTypeFilter({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Filter by type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All songs</SelectItem>
        <SelectItem value="banger">Bangers</SelectItem>
        <SelectItem value="ballad">Ballads</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Toolbar component
function SongsToolbar({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDelete, 
  isDeleting, 
  filterType, 
  onFilterChange,
  onAddToJam,
  targetJam,
  onChangeTargetJam
}) {
  return (
    <div className="sticky top-0 z-10">
      <div className="mb-4 bg-background shadow-sm rounded-lg p-3 pl-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedCount === totalCount && totalCount > 0}
              onCheckedChange={onSelectAll}
              aria-label="Select all songs"
              className="mr-4"
            />
            {targetJam && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Target: {targetJam.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onChangeTargetJam}
                  className="h-6 w-6"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
            <AddSongToTargetJamButton
              selectedCount={selectedCount}
              onJamSelected={onAddToJam}
              targetJam={targetJam}
            />
          </div>

          {/* Right group - action buttons and filter */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline-destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting || selectedCount === 0}
              className="flex-shrink-0"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </span>
            </Button>
            <SongTypeFilter value={filterType} onChange={onFilterChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SongsPage() {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetJam, setTargetJam] = useState(null);

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

  const handleAddToJam = async (jam) => {
    try {
      const selectedSongIds = Array.from(selectedSongs);
      const response = await addSongsToJam(jam._id, selectedSongIds);

      // Set the target jam if not already set
      if (!targetJam) {
        setTargetJam(jam);
      }

      // Clear selection after successful add
      setSelectedSongs(new Set());
      setLastClickedIndex(null);
      
      return response;
    } catch (error) {
      console.error('Error adding songs to jam:', error);
      throw error;
    }
  };

  // Add handler for changing target jam
  const handleChangeTargetJam = () => {
    setTargetJam(null);
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

  // Filter songs based on type and search query
  const filteredSongs = songs.filter(song => {
    const matchesType = filterType === 'all' ? true : song.type === filterType;
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Songs</h1>
            <p className="text-gray-600 mt-2">
              {songs.length} songs in the library
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="flex-shrink-0"
          >
            Import Songs
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
          <div className="flex-1">
            <SearchInput
              placeholder="Filter songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <SongsToolbar
        selectedCount={selectedSongs.size}
        totalCount={filteredSongs.length}
        onSelectAll={toggleAllSelection}
        onDelete={() => setShowDeleteDialog(true)}
        isDeleting={isDeleting}
        filterType={filterType}
        onFilterChange={setFilterType}
        onAddToJam={handleAddToJam}
        targetJam={targetJam}
        onChangeTargetJam={handleChangeTargetJam}
      />

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
        confirmText={isDeleting ? 'Deleting...' : `Delete ${selectedSongs.size} Songs`}
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