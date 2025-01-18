import Modal, { ModalPrimaryButton, ModalSecondaryButton } from '@/components/Modal';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const form = useForm({
    defaultValues: {
      title: mode === 'add' ? initialTitle : initialData.title,
      artist: initialData.artist,
      type: initialData.type,
      chordChart: initialData.chordChart
    }
  });

  const handleSubmit = async (formData) => {
    try {
      // First create/update the song
      const endpoint = mode === 'edit' 
        ? `/api/songs/${initialData._id}` 
        : '/api/songs';

      const response = await fetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _id: mode === 'edit' ? initialData._id : undefined
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
        <form id="song-form" onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
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
                    <FormLabel>Chord Chart URL</FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://tabs.ultimate-guitar.com/..." 
                        {...field} 
                      />
                    </FormControl>
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