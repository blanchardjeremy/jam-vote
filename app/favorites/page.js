'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StarIcon } from '@heroicons/react/24/outline';
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { fetchSongs, useSongOperations } from '@/lib/services/songs';
import { addSongsToJam } from '@/lib/services/jams';
import { applySongFilters } from '@/lib/utils/songFilters';
import AddSongToTargetJamButton from "@/components/AddSongToTargetJamButton";
import SongListRow from "@/components/SongRowList";
import SongModals from "@/components/SongModals";
import LoadingBlock from "@/components/LoadingBlock";
import PageTitle from '@/components/ui/page-title';

function FavoritesContent() {
  const searchParams = useSearchParams();
  const jamSlug = searchParams.get('jam');

  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [targetJam, setTargetJam] = useState(null);
  const [editModalState, setEditModalState] = useState({ isOpen: false, song: null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, song: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const { handleEdit, handleDelete } = useSongOperations({
    songs,
    setSongs,
    selectedSongs,
    setSelectedSongs,
    onSuccess: null,
    onError: null
  });

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  // When opened from a jam (/favorites?jam=<slug>), add songs to that jam by default
  useEffect(() => {
    if (!jamSlug) return;
    fetch(`/api/jams/by-slug/${encodeURIComponent(jamSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((jam) => jam && setTargetJam(jam))
      .catch(() => {});
  }, [jamSlug]);

  const favoriteSongs = useMemo(() => {
    const favorites = songs.filter((song) => song.favorite);
    return applySongFilters(favorites, { type: 'all', query, sort: 'dateAdded_desc' });
  }, [songs, query]);

  const songIdsInTargetJam = useMemo(
    () => new Set((targetJam?.songs || []).map((s) => s.song?._id || s.song)),
    [targetJam]
  );

  const toggleSelection = (songId) => {
    setSelectedSongs((prev) => {
      const next = new Set(prev);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedSongs.size === favoriteSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(favoriteSongs.map((song) => song._id)));
    }
  };

  const handleAddToJam = async (jam) => {
    if (jam === null) {
      setTargetJam(null);
      setSelectedSongs(new Set());
      return;
    }
    const response = await addSongsToJam(jam._id, Array.from(selectedSongs));
    const addedIds = (response?.addedSongs || []).map(String);
    setTargetJam((prev) => {
      const base = prev && prev._id === jam._id ? prev : jam;
      return { ...base, songs: [...(base.songs || []), ...addedIds.map((id) => ({ song: id }))] };
    });
    setSelectedSongs(new Set());
    return response;
  };

  const handleEditSubmit = async (updatedSong) => {
    if (!editModalState.song) return;
    await handleEdit(editModalState.song._id, updatedSong);
    setEditModalState({ isOpen: false, song: null });
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
        <h3 className="text-sm font-medium text-red-800">Error loading favorites</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingBlock />;
  }

  return (
    <div className="container mx-auto sm:px-4 sm:py-8">
      <PageTitle title="Favorites" />
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <StarIcon className="h-6 w-6" /> Favorites
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2">
          {favoriteSongs.length === 1 ? '1 favorite song' : `${favoriteSongs.length} favorite songs`}
          {targetJam && (
            <>
              {' • Adding to '}
              <Link href={`/${targetJam.slug}`} className="font-medium text-indigo-700 hover:underline">
                {targetJam.name}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="sticky top-0 z-10 mb-4 bg-background shadow-sm rounded-lg p-3 pl-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedSongs.size === favoriteSongs.length && favoriteSongs.length > 0}
              onCheckedChange={toggleAllSelection}
              aria-label="Select all favorites"
              className="mr-4"
            />
            <AddSongToTargetJamButton
              onJamSelected={handleAddToJam}
              selectedCount={selectedSongs.size}
              targetJam={targetJam}
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <SearchInput
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Search favorites..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {favoriteSongs.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-gray-500">
              {query
                ? 'No favorites match your search.'
                : <>No favorites yet. To add one, edit a song and check <b>Favorite</b>.</>}
            </li>
          ) : (
            favoriteSongs.map((song) => (
              <li key={song._id} className="hover:bg-gray-50 transition-colors duration-200">
                <SongListRow
                  song={song}
                  onEdit={(s) => setEditModalState({ isOpen: true, song: s })}
                  onDelete={(s) => setDeleteModalState({ isOpen: true, song: s })}
                  isSelected={selectedSongs.has(song._id)}
                  onSelectionChange={() => toggleSelection(song._id)}
                />
                {songIdsInTargetJam.has(song._id) && (
                  <p className="px-4 pb-2 -mt-1 text-xs text-gray-500">Already in this jam</p>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      <SongModals
        editModalState={editModalState}
        onEditClose={() => setEditModalState({ isOpen: false, song: null })}
        onEditSubmit={handleEditSubmit}
        deleteModalState={deleteModalState}
        onDeleteClose={() => setDeleteModalState({ isOpen: false, song: null })}
        onDeleteConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <FavoritesContent />
    </Suspense>
  );
}
