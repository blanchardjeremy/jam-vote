import Modal, { ModalPrimaryButton, ModalSecondaryButton } from '@/components/Modal';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { SongResults } from '@/components/SongResults';
import { searchSongs } from '@/lib/services/songs';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SongFormModal({ 
  isOpen, 
  onClose, 
  initialData = {
    title: '',
    artist: '',
    type: 'banger',
    chordChart: ''
  },
  initialTitle = '',
  mode = 'add', // 'add' or 'edit'
  onSubmit,
  jamId
}) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const form = useForm({
    defaultValues: {
      title: mode === 'add' ? initialTitle || '' : initialData.title || '',
      artist: initialData.artist || '',
      type: initialData.type || 'banger',
      chordChart: initialData.chordChart || initialData.chordChart || ''
    }
  });

  const debouncedTitle = useDebounce(form.watch('title'), 300);

  useEffect(() => {
    // Only search in add mode and when modal is open
    if (mode !== 'add' || !isOpen) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      if (debouncedTitle.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchSongs(debouncedTitle);
        const MAX_RESULTS = 3;
        setSearchResults(results.slice(0, MAX_RESULTS));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedTitle, mode, isOpen]);

  // Clear results when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [isOpen]);

  const handleSongSelect = (song) => {
    if (mode === 'add') {
      // Pass the full song data to onClose for handling in the parent
      onClose(song);
      return;
    }
    
    // Original behavior for edit mode
    form.setValue('title', song.title);
    form.setValue('artist', song.artist);
    form.setValue('type', song.type);
    if (song.chordChart) {
      form.setValue('chordChart', song.chordChart);
    }
    setSearchResults([]);
  };

  const handleSubmit = async (formData) => {
    try {
      // First create/update the song
      const endpoint = mode === 'edit' 
        ? `/api/songs/${initialData._id || initialData.song?._id}` 
        : '/api/songs';

      const response = await fetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _id: mode === 'edit' ? (initialData._id || initialData.song?._id) : undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${mode} song`);
      }
      
      const song = await response.json();

      // If we're adding a new song and have a jamId, add it to the jam
      if (mode === 'add' && jamId) {
        const jamResponse = await fetch(`/api/jams/${jamId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ songId: song._id })
        });

        if (!jamResponse.ok) {
          const error = await jamResponse.json();
          throw new Error(error.error || 'Failed to add song to jam');
        }

        const updatedJam = await jamResponse.json();
        onSubmit?.(updatedJam);
      } else {
        onSubmit?.(song);
      }
      
      onClose();
    } catch (error) {
      console.error(`Error ${mode}ing song:`, error);
    }
  };

  const title = mode === 'edit' ? 'Edit Song' : 'Add New Song';
  const submitText = mode === 'edit' ? 'Save Changes' : 'Add Song';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <ModalPrimaryButton type="submit" form="song-form">
            {submitText}
          </ModalPrimaryButton>
          <ModalSecondaryButton onClick={onClose}>
            Cancel
          </ModalSecondaryButton>
        </>
      }
    >
      <Form {...form}>
        <form id="song-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2 relative">
              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Title</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {mode === 'add' && (
                      <SongResults
                        results={searchResults}
                        isLoading={isSearching}
                        onSelect={handleSongSelect}
                        maxResults={3}
                        mode="inline"
                        className="w-full bg-muted/40 text-muted-foreground shadow-sm rounded-b-lg border border-t-0 !mt-0"
                        header={
                          <div className="py-2 px-3 text-sm font-bold text-red-700">
                            This song might already exist! Please click below to choose it!
                          </div>
                        }
                      />
                    )}
                  </FormItem>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="artist"
                rules={{ required: "Artist is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="type"
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banger">Banger</SelectItem>
                          <SelectItem value="ballad">Ballad</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="chordChart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chords/Lyrics URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://tabs.ultimate-guitar.com/..." 
                          {...field} 
                        />
                      </FormControl>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(field.value, '_blank')}
                          title="Open chord chart in new window"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </Modal>
  );
} 