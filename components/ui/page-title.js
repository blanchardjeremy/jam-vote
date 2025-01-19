'use client';

import { useEffect } from 'react';

export default function PageTitle({ title, suffix = 'Music Jam Voting | CouchJams' }) {
  useEffect(() => {
    // Update the document title when the component mounts or title changes
    document.title = suffix ? `${title} | ${suffix}` : title;

    // Cleanup - reset to default when component unmounts
    return () => {
      document.title = 'CouchJams';
    };
  }, [title, suffix]);

  // This component doesn't render anything visible
  return null;
} 