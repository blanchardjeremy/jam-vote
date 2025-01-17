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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchSongs, useSongOperations } from '@/lib/services/songs';
import { toast } from 'sonner';

export default function SongsPage() {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);

  // Get song operations from our service
  const { handleEdit, handleDelete, handleBulkDelete } = useSongOperations({
    songs,
    setSongs,
    selectedSongs,
    setSelectedSongs,
    onSuccess: (message) => toast.success(message),
    onError: (message) => toast.error(message)
  });

  useEffect(() => {
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

    loadSongs();
  }, []);

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await handleBulkDelete(selectedSongs);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (songId, currentIndex, event) => {
    // Handle both checkbox change events and native click events
    const isShiftClick = event?.shiftKey || event?.nativeEvent?.shiftKey;
    
    if (isShiftClick && lastClickedIndex !== null) {
      // Handle shift-click range selection
      const start = Math.min(lastClickedIndex, currentIndex);
      const end = Math.max(lastClickedIndex, currentIndex);
      const rangeIds = filteredSongs.slice(start, end + 1).map(song => song._id);

      setSelectedSongs(prev => {
        const next = new Set(prev);
        // If we're unselecting, remove all in range
        if (next.has(songId)) {
          rangeIds.forEach(id => next.delete(id));
        } else {
          // If we're selecting, add all in range
          rangeIds.forEach(id => next.add(id));
        }
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

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-white shadow-sm rounded-lg p-3 border border-gray-200">
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


          {selectedSongs.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete {selectedSongs.size} selected
            </Button>
          )}
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
                  onSelectionChange={(checked, event) => toggleSelection(song._id, index, event)}
                  hideType={filterType !== 'all'}
                />
              </li>
            ))
          )}
        </ul>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Songs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSongs.size} songs? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Songs'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 