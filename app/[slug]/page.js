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
import { useState } from 'react';

export default function JamPage() {
  const params = useParams();
  const [hostMode, setHostMode] = useState(false);
  // Collapsed song-type sections, e.g. collapse Bangers to jump straight to Ballads
  const [collapsed, setCollapsed] = useState({ banger: false, ballad: false });
  const toggleSection = (type) => setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));
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
    groupingEnabled,
    clearHighlightAfterDelay
  });

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

  return (
    <JamProvider initialJam={jam} setJam={setJam}>
      <PageTitle title={jam?.name || 'Loading Jam...'} />
      
      <JamHeader 
        onDeleteClick={() => setShowDeleteDialog(true)} 
        hostMode={hostMode}
        setHostMode={setHostMode}
      />

      <JamToolbar 
        songAutocompleteRef={songAutocompleteRef}
        handleSelectExisting={handleSelectExisting}
        handleAddNew={handleAddNew}
        currentSongs={jam.songs}
      />

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
                  <ul className="divide-y divide-gray-200">
                    {renderSongList({
                      songs: groupedSongs.bangers,
                      hideTypeBadge: true,
                      type: "banger"
                    })}
                  </ul>
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
                  <ul className="divide-y divide-gray-200">
                    {renderSongList({
                      songs: groupedSongs.ballads,
                      hideTypeBadge: true,
                      type: "ballad"
                    })}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <ul className="divide-y divide-gray-200">
              {renderSongList({
                songs: groupedSongs.ungrouped,
                hideTypeBadge: false,
                type: "all"
              })}
            </ul>
          )}
        </div>
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
