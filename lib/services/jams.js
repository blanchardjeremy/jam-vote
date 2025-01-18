import { apiRequest } from './apiHelpers';

// Fetch all jams
export async function fetchJams() {
  return apiRequest('/api/jams');
}

// Add songs to a jam
export async function addSongsToJam(jamId, songIds) {
  return apiRequest(`/api/jams/${jamId}/songs`, {
    method: 'POST',
    body: JSON.stringify({ songIds })
  });
}

// Create a new jam
export async function createJam(jamData) {
  return apiRequest('/api/jams', {
    method: 'POST',
    body: JSON.stringify(jamData)
  });
}

// Delete a jam
export async function deleteJam(jamId) {
  return apiRequest(`/api/jams/${jamId}`, {
    method: 'DELETE'
  });
}

// Update a jam
export async function updateJam(jamId, jamData) {
  return apiRequest(`/api/jams/${jamId}`, {
    method: 'PATCH',
    body: JSON.stringify(jamData)
  });
}

// Hook for components that need jam operations
export function useJamOperations({ jams, setJams, onSuccess, onError }) {
  const handleCreate = async (jamData) => {
    try {
      const newJam = await createJam(jamData);
      setJams(prev => [...prev, newJam]);
      onSuccess?.('Jam created successfully');
      return newJam;
    } catch (error) {
      console.error('Error creating jam:', error);
      onError?.(error.message);
      throw error;
    }
  };

  const handleDelete = async (jamId) => {
    try {
      await deleteJam(jamId);
      setJams(prev => prev.filter(jam => jam._id !== jamId));
      onSuccess?.('Jam deleted successfully');
    } catch (error) {
      console.error('Error deleting jam:', error);
      onError?.(error.message);
      throw error;
    }
  };

  const handleUpdate = async (jamId, jamData) => {
    try {
      const updatedJam = await updateJam(jamId, jamData);
      setJams(prev => prev.map(jam => 
        jam._id === jamId ? { ...jam, ...updatedJam } : jam
      ));
      onSuccess?.('Jam updated successfully');
      return updatedJam;
    } catch (error) {
      console.error('Error updating jam:', error);
      onError?.(error.message);
      throw error;
    }
  };

  const handleAddSongs = async (jamId, songIds) => {
    try {
      console.log('[handleAddSongs] Adding songs:', { jamId, songIds });
      const response = await addSongsToJam(jamId, songIds);
      console.log('[handleAddSongs] API Response:', response);
      
      setJams(prev => prev.map(jam =>
        jam._id === jamId ? { ...jam, songs: [...jam.songs, ...response.addedSongs] } : jam
      ));
      onSuccess?.('Songs added to jam successfully');
      return response;
    } catch (error) {
      console.error('Error adding songs to jam:', error);
      onError?.(error.message);
      throw error;
    }
  };

  return {
    handleCreate,
    handleDelete,
    handleUpdate,
    handleAddSongs
  };
} 