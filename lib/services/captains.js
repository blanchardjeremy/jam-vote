import { apiRequest } from './apiHelpers';

// type: 'regular' | 'piano'
export function signUpAsCaptain(jamId, jamSongId, name, type = 'regular') {
  return apiRequest(`/api/jams/${jamId}/captain`, {
    method: 'POST',
    body: JSON.stringify({ songId: jamSongId, name, type }),
  });
}

export function removeAsCaptain(jamId, jamSongId, name) {
  return apiRequest(
    `/api/jams/${jamId}/captain?songId=${jamSongId}&name=${encodeURIComponent(name)}`,
    { method: 'DELETE' }
  );
}
