import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';

export async function POST(request, context) {
  try {
    console.log('[Songs API] Received add songs request');
    await connectDB();
    const { songIds } = await request.json();
    const params = await context.params;
    const jamId = params.id;

    console.log('[Songs API] Request details:', { jamId, songIds });

    if (!songIds || !Array.isArray(songIds)) {
      console.log('[Songs API] Invalid request: songIds must be an array');
      return NextResponse.json(
        { error: 'Invalid request: songIds must be an array' },
        { status: 400 }
      );
    }

    const jam = await Jam.findById(jamId);
    if (!jam) {
      console.log('[Songs API] Jam not found:', jamId);
      return NextResponse.json(
        { error: 'Jam not found' },
        { status: 404 }
      );
    }

    // Check for duplicate songs
    const existingSongIds = jam.songs.map(song => song.song.toString());
    const duplicateSongs = songIds.filter(id => existingSongIds.includes(id.toString()));
    const newSongIds = songIds.filter(id => !existingSongIds.includes(id.toString()));

    // Create song entries with just the required song reference for non-duplicate songs
    const newSongs = newSongIds.map(songId => ({
      song: songId
    }));

    // Add only the new songs to the jam
    jam.songs.push(...newSongs);
    await jam.save();
    console.log('[Songs API] Saved jam successfully');

    return NextResponse.json({
      success: true,
      addedSongs: newSongIds,
      skippedSongs: duplicateSongs,
      message: duplicateSongs.length > 0 ? `${duplicateSongs.length} duplicate songs were skipped` : undefined
    });
  } catch (error) {
    console.error('[Songs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add songs to jam' },
      { status: 500 }
    );
  }
} 