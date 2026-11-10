'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { ArrowDownNarrowWide } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSongs, useSongOperations } from '@/lib/services/songs';
import { addSongsToJam } from '@/lib/services/jams';
import SongListRow from "@/components/SongRowList";
import SongModals from "@/components/SongModals";
import SelectJamModal from "@/components/SelectJamModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingBlock from "@/components/LoadingBlock";
import PageTitle from '@/components/ui/page-title';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'banger', label: 'Bangers' },
  { value: 'ballad', label: 'Ballads' },
];

const SORT_OPTIONS = [
  { value: 'artist', label: 'Artist' },
  { value: 'title', label: 'Title' },
  { value: 'added', label: 'Newest' },
];

// "The Beatles" sorts under B
const sortName = (name = '') => name.replace(/^the\s+/i, '');
const byName = (a, b) => sortName(a).localeCompare(sortName(b), undefined, { sensitivity: 'base' });

const SORTERS = {
  added: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  title: (a, b) => byName(a.title, b.title),
  artist: (a, b) => byName(a.artist, b.artist) || byName(a.title, b.title),
};

function FavoritesContent() {
  const searchParams = useSearchParams();
  const jamSlug = searchParams.get('jam');

  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('artist');
  const [targetJam, setTargetJam] = useState(null);
  const [editModalState, setEditModalState] = useState({ isOpen: false, song: null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, song: null });
  const [isDeleting, setIsDeleting] = useState(false);
  // A song whose "+" was tapped before a jam was picked
  const [songAwaitingJam, setSongAwaitingJam] = useState(null);
  // A song whose star was tapped, waiting for "Remove" to be confirmed
  const [songToUnfavorite, setSongToUnfavorite] = useState(null);

  const { handleEdit, handleDelete, handleToggleFavorite } = useSongOperations({
    songs,
    setSongs,
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

  const allFavorites = useMemo(() => songs.filter((song) => song.favorite), [songs]);

  const favoriteSongs = useMemo(
    () => allFavorites
      .filter((song) => typeFilter === 'all' || song.type === typeFilter)
      .sort(SORTERS[sort]),
    [allFavorites, typeFilter, sort]
  );

  const songIdsInTargetJam = useMemo(
    () => new Set((targetJam?.songs || []).map((s) => s.song?._id || s.song)),
    [targetJam]
  );

  // Add a song to a jam, which then becomes the jam this page adds to
  const addToJam = async (jam, songIds) => {
    const response = await addSongsToJam(jam._id, songIds);
    const addedIds = (response?.addedSongs || []).map(String);
    setTargetJam((prev) => {
      const base = prev && prev._id === jam._id ? prev : jam;
      return { ...base, songs: [...(base.songs || []), ...addedIds.map((id) => ({ song: id }))] };
    });
    return response;
  };

  // The row's "+": add that one song to the current jam, or pick a jam first
  const handleAddOneToJam = async (song, jam = targetJam) => {
    if (!jam) {
      setSongAwaitingJam(song);
      return;
    }
    try {
      const response = await addToJam(jam, [song._id]);
      if (response?.skippedSongs?.length) {
        toast.warning(`${song.title} is already in ${jam.name}`);
        return;
      }
      toast.success(`Added ${song.title} to ${jam.name}`, {
        action: { label: 'View Jam', onClick: () => window.open(`/${jam.slug}`, '_blank') },
      });
    } catch {
      toast.error('Failed to add song to jam');
    }
  };

  // Adding a favorite is instant. Removing one asks first, since the star is
  // easy to hit by accident and the song then drops off this list.
  const handleStarClick = (songId, favorite) => {
    if (favorite) return handleToggleFavorite(songId, true);
    setSongToUnfavorite(songs.find((s) => s._id === songId) || null);
  };

  const handleUnfavoriteConfirm = async () => {
    const song = songToUnfavorite;
    setSongToUnfavorite(null);
    if (song) await handleToggleFavorite(song._id, false);
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
          {allFavorites.length === 1 ? '1 favorite song' : `${allFavorites.length} favorite songs`}
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

      {allFavorites.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {/* Same switch as guided voting */}
          <ToggleGroup.Root
            type="single"
            value={typeFilter}
            // Tapping the selected option again would clear it; keep it selected
            onValueChange={(value) => value && setTypeFilter(value)}
            aria-label="Which songs to show"
            className="flex w-fit shrink-0 rounded-full bg-gray-200/70 p-0.5"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <ToggleGroup.Item
                key={value}
                value={value}
                className="rounded-full px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm sm:px-3.5"
              >
                {label}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger aria-label="Sort favorites" className="h-9 w-auto gap-1.5 border-0 bg-transparent px-2 text-sm text-gray-600 shadow-none hover:text-gray-900">
              <ArrowDownNarrowWide className="h-4 w-4 text-muted-foreground" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {SORT_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {favoriteSongs.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-gray-500">
              {allFavorites.length
                ? `No ${typeFilter === 'banger' ? 'bangers' : 'ballads'} in your favorites yet.`
                : <>No favorites yet. To add one, edit a song and check <b>Favorite</b>.</>}
            </li>
          ) : (
            favoriteSongs.map((song) => (
              <li key={song._id} className="hover:bg-gray-50 transition-colors duration-200">
                <SongListRow
                  song={song}
                  onEdit={(s) => setEditModalState({ isOpen: true, song: s })}
                  onDelete={(s) => setDeleteModalState({ isOpen: true, song: s })}
                  onToggleFavorite={handleStarClick}
                  actionsInMenu
                  onAddToJam={handleAddOneToJam}
                  inJam={songIdsInTargetJam.has(song._id)}
                />
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

      <SelectJamModal
        isOpen={!!songAwaitingJam}
        onClose={() => setSongAwaitingJam(null)}
        onSelect={(jam) => {
          const song = songAwaitingJam;
          setSongAwaitingJam(null);
          if (jam && song) handleAddOneToJam(song, jam);
        }}
      />

      <ConfirmDialog
        isOpen={!!songToUnfavorite}
        onClose={() => setSongToUnfavorite(null)}
        onConfirm={handleUnfavoriteConfirm}
        title="Remove from favorites?"
        description={songToUnfavorite && (
          <><b>{songToUnfavorite.title}</b> by {songToUnfavorite.artist} will come off your favorites list.</>
        )}
        confirmText="Remove"
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
