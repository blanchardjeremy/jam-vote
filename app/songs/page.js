'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  TrashIcon, 
  CalendarDaysIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";
import { fetchSongs, useSongOperations } from '@/lib/services/songs';
import { addSongsToJam } from '@/lib/services/jams';
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from '@/lib/hooks/useDebounce';
import ImportSongsModal from "@/components/ImportSongsModal";
import AddSongToTargetJamButton from "@/components/AddSongToTargetJamButton";
import CreateSongButton from "@/components/CreateSongButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import SongListRow from "@/components/SongRowList";
import LoadingBlock from "@/components/LoadingBlock";
import SongModals from "@/components/SongModals";
import { ArrowDownNarrowWide } from 'lucide-react';
import { applySongFilters } from '@/lib/utils/songFilters';
import PageTitle from '@/components/ui/page-title';

const SONG_TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'banger', label: 'Bangers' },
  { value: 'ballad', label: 'Ballads' },
];

const SORT_OPTIONS = [
  { 
    value: 'dateAdded_desc',
    label: 'Added recently',
    icon: CalendarDaysIcon,
  },
  { 
    value: 'dateAdded_asc',
    label: 'Added long ago',
    icon: CalendarDaysIcon,
  },
  { 
    value: 'count_desc',
    label: 'Most played',
    icon: HashtagIcon,
  },
  { 
    value: 'count_asc',
    label: 'Least played',
    icon: HashtagIcon,
  },
  { 
    value: 'lastPlayed_desc',
    label: 'Recently played',
    icon: CalendarDaysIcon,
  },
  { 
    value: 'lastPlayed_asc',
    label: 'Not recently played',
    icon: CalendarDaysIcon,
  },
];

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">

      <SearchInput
        placeholder="Search songs..."
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        className="w-full sm:w-auto flex-1"
      />

      <Select 
        value={filters.type} 
        onValueChange={(value) => onChange({ ...filters, type: value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {SONG_TYPE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={filters.sort} 
        onValueChange={(value) => onChange({ ...filters, sort: value })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {(() => {
              const selectedOption = SORT_OPTIONS.find(opt => opt.value === filters.sort);
              if (!selectedOption?.icon) return null;
              const IconComponent = selectedOption.icon;
              return (
                <div className="flex items-center gap-2">
                  <ArrowDownNarrowWide className="h-5 w-5 text-muted-foreground" />
                  {selectedOption.label}
                </div>
              );
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map(option => {
            const IconComponent = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

    </div>
  );
}

// Toolbar component
function SongsToolbar({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDelete, 
  isDeleting, 
  filters,
  onFiltersChange,
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
          
            <AddSongToTargetJamButton
              selectedCount={selectedCount}
              onJamSelected={onAddToJam}
              targetJam={targetJam}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting || selectedCount === 0}
              className="flex-shrink-0"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Right group - action buttons and filter */}
          <div className="flex items-center gap-3">
            <FilterBar
              filters={filters}
              onChange={onFiltersChange}
            />
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
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetJam, setTargetJam] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    query: '',
    sort: 'dateAdded_desc'
  });
  const [editModalState, setEditModalState] = useState({ isOpen: false, song: null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, song: null });

  // Debounce the search query
  const debouncedFilters = useDebounce(filters, 300);

  // Memoize the filtered songs to prevent unnecessary recalculations
  const filteredSongs = useMemo(() => {
    return applySongFilters(songs, debouncedFilters);
  }, [songs, debouncedFilters]);

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
      if (jam === null) {
        // Clear the target jam selection
        setTargetJam(null);
        setSelectedSongs(new Set());
        return;
      }

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

  const handleDuplicateSongSelect = (song) => {
    // Clear any filters and search
    setFilters({
      type: 'all',
      query: '',
    });

    console.log("Scroll to song:", song._id);

    // Find the index of the song in the unfiltered list
    const songIndex = songs.findIndex(s => s._id === song._id);
    if (songIndex !== -1) {
      // Select the song
      setSelectedSongs(new Set([song._id]));
      setLastClickedIndex(songIndex);

      // Scroll to the song after a short delay to allow filters to update
      setTimeout(() => {
        const element = document.getElementById(`song-${song._id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-yellow-50');
          setTimeout(() => {
            element.classList.remove('bg-yellow-50');
          }, 2000);
        }
      }, 100);
    }
  };

  const handleEditSong = (song) => {
    if (!song) return;
    setEditModalState({ isOpen: true, song });
  };

  const handleEditSubmit = async (updatedSong) => {
    if (!editModalState.song) return;
    await handleEdit(editModalState.song._id, updatedSong);
    setEditModalState({ isOpen: false, song: null });
  };

  const handleDeleteSong = (song) => {
    if (!song) return;
    setDeleteModalState({ isOpen: true, song });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalState.song) return;
    setIsDeleting(true);
    try {
      await handleDelete(deleteModalState.song._id);
      setDeleteModalState({ isOpen: false, song: null });
    } finally {
      setIsDeleting(false);
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
    return <LoadingBlock />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle title="Song Library" />
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Songs</h1>
            <p className="text-gray-600 mt-2">
              {songs.length} songs in the library
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateSongButton 
              onSongCreated={loadSongs} 
              variant="outline" 
              onDuplicateSelect={handleDuplicateSongSelect}
            />
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
      </div>


      {/* Toolbar */}
      <SongsToolbar
        selectedCount={selectedSongs.size}
        totalCount={filteredSongs.length}
        onSelectAll={toggleAllSelection}
        onDelete={() => setShowDeleteDialog(true)}
        isDeleting={isDeleting}
        filters={filters}
        onFiltersChange={setFilters}
        onAddToJam={handleAddToJam}
        targetJam={targetJam}
        onChangeTargetJam={handleChangeTargetJam}
      />

      {/* Songs list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {filteredSongs.length === 0 ? (
            <li className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500 mb-4">
                No songs found matching your search
              </p>
              <CreateSongButton 
                initialTitle={filters.query} 
                className="mx-auto"
                onSongCreated={loadSongs}
                onDuplicateSelect={handleDuplicateSongSelect}
                variant="primary"
              />
            </li>
          ) : (
            filteredSongs.map((song, index) => (
              <li 
                key={song._id} 
                id={`song-${song._id}`}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <SongListRow 
                  song={song}
                  onEdit={handleEditSong}
                  onDelete={handleDeleteSong}
                  isSelected={selectedSongs.has(song._id)}
                  onSelectionChange={(checked) => toggleSelection(song._id, index)}
                  hideType={filters.type !== 'all'}
                />
              </li>
            ))
          )}
        </ul>
        
        {/* Bottom create button */}
        {filteredSongs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
            <span className="text-sm text-gray-500 mr-4">
              Can't find the song you're looking for?
            </span>
            <CreateSongButton 
              label="Create a New Song"
              onSongCreated={loadSongs}
              onDuplicateSelect={handleDuplicateSongSelect}
              variant="primary"
            />
          </div>
        )}
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

      {/* Modals */}
      <SongModals
        editModalState={editModalState}
        onEditClose={() => setEditModalState({ isOpen: false, song: null })}
        onEditSubmit={handleEditSubmit}
        deleteModalState={deleteModalState}
        onDeleteClose={() => setDeleteModalState({ isOpen: false, song: null })}
        onDeleteConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
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