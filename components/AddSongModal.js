import Modal, { ModalPrimaryButton, ModalSecondaryButton } from '@/components/Modal';

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
  jamId // Add jamId prop
}) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    
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

  const defaultTitle = mode === 'add' ? initialTitle : initialData.title;

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
      <form id="song-form" onSubmit={handleSubmit} className="mt-4 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6 gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Song Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              defaultValue={defaultTitle}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700">
              Artist
            </label>
            <input
              type="text"
              name="artist"
              id="artist"
              required
              defaultValue={initialData.artist}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              name="type"
              id="type"
              required
              defaultValue={initialData.type}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="banger">Banger</option>
              <option value="ballad">Ballad</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="chordChart" className="block text-sm font-medium text-gray-700">
              Chord Chart URL
            </label>
            <input
              type="url"
              name="chordChart"
              id="chordChart"
              defaultValue={initialData.chordChart}
              placeholder="https://tabs.ultimate-guitar.com/..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
} 