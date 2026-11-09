'use client';

import { useParams } from 'next/navigation';
import { useJamPage } from '@/lib/hooks/useJamPage';
import { useJamPusher } from '@/lib/hooks/useJamPusher';
import { getGroupedSongs } from '@/lib/utils/songGrouping';
import JamHeader from '@/components/jam/JamHeader';
import JamToolbar from '@/components/jam/JamToolbar';
import JamSongList from '@/components/jam/JamSongList';
import JamEmptyState from '@/components/jam/JamEmptyState';
import { FireIcon, MusicalNoteIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import LoadingBlock from "@/components/LoadingBlock";
import CreateSongModal from "@/components/CreateSongModal";
import ConfirmDialog from '@/components/ConfirmDialog';
import PageTitle from '@/components/ui/page-title';
import { JamProvider } from '@/components/JamContext';
import StickyQRCode from "@/components/StickyQRCode";
import { useState, useEffect, useReducer, useRef } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { buildQueue } from '@/lib/utils/guideQueue';
import { cn } from '@/lib/utils';
import FavoriteSuggestions, { pickRandomFavorites } from '@/components/jam/FavoriteSuggestions';

// With "Include favorites" on (⋮ menu), only songs with at least this many
// hearts OR at least this many "know it" are listed (played songs always stay
// visible), and a few favorites are suggested under each section.
const FAVORITES_VIEW_MIN_COUNT = 5;
const FAVORITE_SUGGESTION_COUNT = 5;

export default function JamPage() {
  const params = useParams();
  const [hostMode, setHostMode] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  // Collapsed song-type sections, e.g. collapse Bangers to jump straight to Ballads
  const [collapsed, setCollapsed] = useState({ banger: false, ballad: false });
  const toggleSection = (type) => setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));
  // Votes live in localStorage, so re-render the page when this device votes
  // to keep the "Not voted" count and the new songs pill current
  const [, voteChanged] = useReducer((n) => n + 1, 0);
  // "Not voted" filter: the songs you hadn't voted on when you turned it on.
  // They stay listed after you vote so you can see your answers.
  const [notVotedIds, setNotVotedIds] = useState(null);
  const {
    jam,
    setJam,
    error,
    isLoading,
    isAddModalOpen,
    setIsAddModalOpen,
    groupingEnabled,
    sortMethod,
    setSortMethod,
    newSongTitle,
    songToDelete,
    setSongToDelete,
    isRemoving,
    setIsRemoving,
    lastAddedSongId,
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    setIsDeleting,
    songAutocompleteRef,
    handleEdit,
    handleRemove,
    handleVote,
    handleKnow,
    allSongs,
    handleTogglePlayed,
    handleDeleteJam,
    handleSelectExisting,
    handleAddNew,
    handleAddSong,
    clearHighlightAfterDelay
  } = useJamPage(params.slug);

  // Set up Pusher connection
  useJamPusher({ 
    jam, 
    setJam, 
    sortMethod, 
    clearHighlightAfterDelay
  });

  // Songs added by other people since you opened the page, that you haven't
  // voted on yet. Songs you add get your heart, so they never count.
  const seenIdsRef = useRef(null);
  const [dismissedNewIds, setDismissedNewIds] = useState(() => new Set());
  useEffect(() => {
    if (jam?.songs && !seenIdsRef.current) {
      seenIdsRef.current = new Set(jam.songs.map((s) => s._id));
    }
  }, [jam?.songs]);

  // "Include favorites": random favorites (not already in the jam) to show under
  // each section. Picked once each time it's turned on, so they don't
  // reshuffle on every vote.
  const [favoriteSuggestions, setFavoriteSuggestions] = useState(null);
  const jamId = jam?._id;
  useEffect(() => {
    if (!showFavorites || !jamId) {
      setFavoriteSuggestions(null);
      return;
    }
    const inJam = new Set((jam.songs || []).map((s) => s.song?._id || s.song));
    setFavoriteSuggestions({
      banger: pickRandomFavorites(allSongs, 'banger', inJam, FAVORITE_SUGGESTION_COUNT),
      ballad: pickRandomFavorites(allSongs, 'ballad', inJam, FAVORITE_SUGGESTION_COUNT),
      any: pickRandomFavorites(allSongs, null, inJam, FAVORITE_SUGGESTION_COUNT),
    });
    // Only re-pick when host tools are toggled (or the song library loads)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavorites, jamId, allSongs]);

  // After a suggested favorite is edited, show the changes; if it's no longer
  // a favorite, drop it from the suggestions.
  const handleSuggestionUpdated = (updated) => {
    if (!updated?._id) return;
    setFavoriteSuggestions((prev) => {
      if (!prev) return prev;
      const apply = (list) => (list || [])
        .map((s) => (s._id === updated._id ? { ...s, ...updated } : s))
        .filter((s) => s.favorite !== false);
      return { banger: apply(prev.banger), ballad: apply(prev.ballad), any: apply(prev.any) };
    });
  };

  const forFavoritesView = (songs) =>
    showFavorites
      ? songs.filter((s) =>
          s.played ||
          s.votes >= FAVORITES_VIEW_MIN_COUNT ||
          (s.knows || 0) >= FAVORITES_VIEW_MIN_COUNT
        )
      : songs;
  const favoritesViewEmptyMessage = `No songs with ${FAVORITES_VIEW_MIN_COUNT}+ hearts or ${FAVORITES_VIEW_MIN_COUNT}+ "know it" yet`;

  // Helper function to render song list with common props
  const renderSongList = ({ songs, hideTypeBadge = false, emptyMessage = "No songs yet - add some tunes!", type }) => (
    <JamSongList 
      songs={songs}
      nextSongId={getGroupedSongs(jam.songs, groupingEnabled).nextSongId}
      onVote={handleVote}
      onKnow={handleKnow}
      onRemove={setSongToDelete}
      onTogglePlayed={handleTogglePlayed}
      onEdit={handleEdit}
      hideTypeBadge={hideTypeBadge}
      emptyMessage={emptyMessage}
      groupingEnabled={groupingEnabled}
      lastAddedSongId={lastAddedSongId}
      type={type}
      hostMode={hostMode}
      onVoteChange={voteChanged}
    />
  );

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading jam</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !jam) {
    return <LoadingBlock />;
  }

  const groupedSongs = getGroupedSongs(jam.songs, groupingEnabled);
  const notVotedQueue = buildQueue(jam.songs);
  // Songs added since you opened the page. They join the "Not voted" list
  // and stay there after you vote, like the rest of it.
  const arrivedIds = seenIdsRef.current
    ? jam.songs.map((s) => s._id).filter((id) => !seenIdsRef.current.has(id))
    : [];
  const forNotVotedView = (songs) =>
    notVotedIds ? songs.filter((s) => notVotedIds.has(s._id) || arrivedIds.includes(s._id)) : songs;
  const forView = (songs) => forNotVotedView(forFavoritesView(songs));
  const notVotedEmptyMessage = "You've voted on every song";
  const viewEmptyMessage = notVotedIds
    ? { emptyMessage: notVotedEmptyMessage }
    : showFavorites && { emptyMessage: favoritesViewEmptyMessage };
  // The ones you haven't voted on yet get the pill
  const newSongIds = notVotedQueue.filter((id) => arrivedIds.includes(id) && !dismissedNewIds.has(id));

  return (
    <JamProvider initialJam={jam} setJam={setJam}>
      <PageTitle title={jam?.name || 'Loading Jam...'} />
      
      <JamHeader 
        onDeleteClick={() => setShowDeleteDialog(true)} 
        hostMode={hostMode}
        setHostMode={setHostMode}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
      />

      <JamToolbar 
        songAutocompleteRef={songAutocompleteRef}
        handleSelectExisting={handleSelectExisting}
        handleAddNew={handleAddNew}
        currentSongs={jam.songs}
      />

      {jam.songs?.length > 0 && (
        <ListFilter
          notVotedCount={notVotedQueue.length}
          showNotVoted={!!notVotedIds}
          onChange={(notVoted) => setNotVotedIds(notVoted ? new Set(notVotedQueue) : null)}
        />
      )}

      {(!jam.songs || jam.songs.length === 0) ? (
        <JamEmptyState />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          {groupingEnabled ? (
            <>
              {/* Bangers Section */}
              <div className="border-b border-gray-200">
                <SectionHeader
                  icon={FireIcon}
                  label="Bangers"
                  collapsed={collapsed.banger}
                  onToggle={() => toggleSection('banger')}
                />
                {!collapsed.banger && (
                  <>
                    <ul className="divide-y divide-gray-200">
                      {renderSongList({
                        songs: forView(groupedSongs.bangers),
                        hideTypeBadge: true,
                        type: "banger",
                        ...viewEmptyMessage
                      })}
                    </ul>
                    <FavoriteSuggestions songs={favoriteSuggestions?.banger} hideTypeBadge onSongUpdated={handleSuggestionUpdated} />
                  </>
                )}
              </div>
              
              {/* Ballads Section */}
              <div>
                <SectionHeader
                  icon={MusicalNoteIcon}
                  label="Ballads"
                  collapsed={collapsed.ballad}
                  onToggle={() => toggleSection('ballad')}
                />
                {!collapsed.ballad && (
                  <>
                    <ul className="divide-y divide-gray-200">
                      {renderSongList({
                        songs: forView(groupedSongs.ballads),
                        hideTypeBadge: true,
                        type: "ballad",
                        ...viewEmptyMessage
                      })}
                    </ul>
                    <FavoriteSuggestions songs={favoriteSuggestions?.ballad} hideTypeBadge onSongUpdated={handleSuggestionUpdated} />
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {renderSongList({
                  songs: forView(groupedSongs.ungrouped),
                  hideTypeBadge: false,
                  type: "all",
                  ...viewEmptyMessage
                })}
              </ul>
              <FavoriteSuggestions songs={favoriteSuggestions?.any} onSongUpdated={handleSuggestionUpdated} />
            </>
          )}
        </div>
      )}

      {newSongIds.length > 0 && (
        <NewSongsPill
          count={newSongIds.length}
          href={`/${params.slug}/guide?song=${newSongIds[0]}`}
          onDismiss={() => setDismissedNewIds((prev) => new Set([...prev, ...newSongIds]))}
        />
      )}

      <CreateSongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialTitle={newSongTitle}
        onSubmit={handleAddSong}
        jamId={jam._id}
      />

      <ConfirmDialog
        isOpen={!!songToDelete}
        onClose={() => setSongToDelete(null)}
        onConfirm={async () => {
          if (songToDelete) {
            setIsRemoving(true);
            try {
              await handleRemove(songToDelete.song._id);
              setSongToDelete(null);
            } finally {
              setIsRemoving(false);
            }
          }
        }}
        title="Remove Song"
        description={songToDelete && `Are you sure you want to remove "${songToDelete.song.title}" by ${songToDelete.song.artist}" from this jam?`}
        confirmText="Remove"
        confirmLoadingText="Removing..."
        isLoading={isRemoving}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await handleDeleteJam(jam._id);
            setShowDeleteDialog(false);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Jam"
        description={`This will permanently delete the jam session "${jam.name}". This action cannot be undone.`}
        confirmText="Delete"
        confirmLoadingText="Deleting..."
        isLoading={isDeleting}
      />

      <StickyQRCode jamSlug={params.slug} />
    </JamProvider>
  );
}

// Bangers / Ballads section header; tap anywhere on it to collapse or expand
function SectionHeader({ icon: Icon, label, collapsed, onToggle }) {
  return (
    <h3>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="w-full bg-indigo-800 px-4 py-4 flex items-center justify-between text-left text-lg font-semibold text-white [@media(hover:hover)]:hover:bg-indigo-700 transition-colors"
      >
        <span className="flex items-center">
          <Icon className="w-5 h-5 mr-2" /> {label}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-white/80 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden
        />
      </button>
    </h3>
  );
}

// "All" or just the songs you haven't voted on yet
function ListFilter({ notVotedCount, showNotVoted, onChange }) {
  const chip = (active) => cn(
    'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
    active
      ? 'border-primary/40 bg-primary/10 text-primary'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  );
  return (
    <div className="mb-3 flex gap-2" role="group" aria-label="Show songs">
      <button type="button" aria-pressed={!showNotVoted} className={chip(!showNotVoted)} onClick={() => onChange(false)}>
        All
      </button>
      <button type="button" aria-pressed={showNotVoted} className={chip(showNotVoted)} onClick={() => onChange(true)}>
        Not voted ({notVotedCount})
      </button>
    </div>
  );
}

// Shown when other people add songs you haven't voted on yet
function NewSongsPill({ count, href, onDismiss }) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 sm:bottom-6" role="status">
      <div className="flex items-center gap-1 rounded-full bg-gray-900 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-lg">
        <span>{count} new {count === 1 ? 'song' : 'songs'} added</span>
        <Link href={href} className="rounded-full px-2.5 py-1 font-semibold text-indigo-300 hover:bg-white/10">
          Vote
        </Link>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white">
          <XMarkIcon aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
