import { toast } from 'sonner';

// Generic API request handler with error handling
export async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = await fetch(url, { ...defaultOptions, ...options });

  if (!res.ok) {
    let errorMessage = `Request failed (HTTP ${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      if (res.statusText) {
        errorMessage += `: ${res.statusText}`;
      }
      // Add context for common status codes
      if (res.status === 404) {
        errorMessage += ' - Not found';
      } else if (res.status === 403) {
        errorMessage += ' - Permission denied';
      } else if (res.status === 401) {
        errorMessage += ' - Unauthorized';
      }
    }
    throw new Error(errorMessage);
  }

  return options.method === 'DELETE' ? { success: true } : res.json();
}

// Generic optimistic update handler
export async function optimisticUpdate({
  updateFn, // Function to update state optimistically
  apiFn, // API call to make
  onSuccess, // Success callback/message
  onError, // Error callback/message
  revertState, // Original state to revert to on error
  setState, // setState function to update UI
  logContext = '' // Context for error logging
}) {
  try {
    // Optimistically update UI
    setState(updateFn);

    // Make API call
    const result = await apiFn();

    // Handle success
    if (typeof onSuccess === 'string') {
      toast.success(onSuccess);
    } else if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (e) {
    // Revert optimistic update on error
    setState(revertState);
    
    // Log error
    console.error(`Error ${logContext}:`, e);
    
    // Handle error
    if (typeof onError === 'string') {
      toast.error(onError);
    } else if (onError) {
      onError(e);
    } else {
      toast.error(e.message);
    }
    
    throw e;
  }
}

// Common optimistic update patterns
export const optimisticHelpers = {
  // Toggle a boolean property
  toggle: (items, itemId, property) => 
    items.map(item => 
      item._id === itemId ? { ...item, [property]: !item[property] } : item
    ),

  // Update a property with a new value
  update: (items, itemId, updates) =>
    items.map(item =>
      item._id === itemId ? { ...item, ...updates } : item
    ),

  // Remove an item
  remove: (items, itemId) =>
    items.filter(item => item._id !== itemId),

  // Update a nested property
  updateNested: (items, itemId, path, updates) =>
    items.map(item =>
      item._id === itemId
        ? {
            ...item,
            [path]: { ...item[path], ...updates }
          }
        : item
    ),

  // Increment/decrement a number property
  increment: (items, itemId, property, amount = 1) =>
    items.map(item =>
      item._id === itemId
        ? { ...item, [property]: item[property] + amount }
        : item
    )
}; 