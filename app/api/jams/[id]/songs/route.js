import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import Song from '@/models/Song';
import { pusherServer } from '@/lib/pusher';

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

    // Validate that none of the songIds are null/undefined
    if (songIds.some(id => !id)) {
      console.log('[Songs API] Invalid request: songIds cannot be null or undefined');
      return NextResponse.json(
        { error: 'Invalid request: songIds cannot be null or undefined' },
        { status: 400 }
      );
    }

    // Get the jam and populate existing songs
    const jam = await Jam.findById(jamId).populate('songs.song');
    if (!jam) {
      console.log('[Songs API] Jam not found:', jamId);
      return NextResponse.json(
        { error: 'Jam not found' },
        { status: 404 }
      );
    }

    // Ensure consistent string comparison by converting all IDs to strings
    const existingSongIds = new Set(jam.songs.map(song => song.song._id.toString()));
    const songIdsAsStrings = songIds.map(id => id.toString());
    
    // Check for duplicates using Set for O(1) lookup
    const duplicateSongs = songIdsAsStrings.filter(id => existingSongIds.has(id));
    const newSongIds = songIdsAsStrings.filter(id => !existingSongIds.has(id));

    console.log('[Songs API] Duplicate detection:', { 
      existingSongIds: Array.from(existingSongIds),
      songIdsAsStrings,
      duplicateSongs,
      newSongIds 
    });

    // Get full song data for new songs
    const newSongDocs = await Song.find({ _id: { $in: newSongIds } });
    
    // Calculate the next order number
    const nextOrder = jam.songs.length > 0 
      ? Math.max(...jam.songs.map(s => s.order || 0)) + 1 
      : 1;

    // Create song entries with song references and sequential order numbers
    const newSongs = newSongDocs.map((songDoc, index) => ({
      song: songDoc._id,
      votes: 0,
      order: nextOrder + index,
      played: false,
      playedAt: null
    }));

    // Add only the new songs to the jam
    jam.songs.push(...newSongs);
    await jam.save();
    console.log('[Songs API] Saved jam successfully');

    // Get the fully populated jam to return and for Pusher events
    const updatedJam = await Jam.findById(jamId).populate('songs.song');

    // Trigger Pusher events for each new song
    for (const songId of newSongIds) {
      const newJamSong = updatedJam.songs.find(s => s.song._id.toString() === songId);
      if (newJamSong) {
        console.log('[Songs API] Triggering Pusher event for song:', newJamSong);
        await pusherServer.trigger(`jam-${jamId}`, 'song-added', {
          song: newJamSong
        });
      }
    }

    return NextResponse.json({
      success: true,
      jam: updatedJam,
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

export async function DELETE(request, context) {
  try {
    console.log('[Songs API] Received delete song request');
    await connectDB();
    const { songId } = await request.json();
    const params = await context.params;
    const jamId = params.id;

    console.log('[Songs API] Request details:', { jamId, songId });

    if (!songId) {
      console.log('[Songs API] Invalid request: songId is required');
      return NextResponse.json(
        { error: 'Invalid request: songId is required' },
        { status: 400 }
      );
    }

    // Get the jam and populate existing songs
    const jam = await Jam.findById(jamId).populate('songs.song');
    if (!jam) {
      console.log('[Songs API] Jam not found:', jamId);
      return NextResponse.json(
        { error: 'Jam not found' },
        { status: 404 }
      );
    }

    // Find and remove the song
    const songIndex = jam.songs.findIndex(song => song.song._id.toString() === songId);
    if (songIndex === -1) {
      console.log('[Songs API] Song not found in jam:', songId);
      return NextResponse.json(
        { error: 'Song not found in jam' },
        { status: 404 }
      );
    }

    // Remove the song
    const removedSong = jam.songs.splice(songIndex, 1)[0];
    await jam.save();
    console.log('[Songs API] Removed song successfully:', removedSong);

    // Trigger Pusher event for song removal
    await pusherServer.trigger(`jam-${jamId}`, 'song-removed', {
      songId: removedSong.song._id,
      songTitle: removedSong.song.title,
      songArtist: removedSong.song.artist
    });

    return NextResponse.json({
      success: true,
      removedSong
    });
  } catch (error) {
    console.error('[Songs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove song from jam' },
      { status: 500 }
    );
  }
} 