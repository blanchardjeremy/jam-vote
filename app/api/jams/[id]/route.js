import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import Song from '@/models/Song';
import { pusherServer } from '@/lib/pusher';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    await connectDB();
    const jam = await Jam.findById(id).populate('songs.song');

    if (!jam) {
      return NextResponse.json(
        { error: 'Jam not found' },
        { status: 404 }
      );
    }

    // Sort the songs by votes in descending order
    jam.songs.sort((a, b) => b.votes - a.votes);

    return NextResponse.json(jam);
  } catch (error) {
    console.error('Error in GET /api/jams/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jam' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    await connectDB();
    const body = await request.json();
    console.log('[Debug PATCH] Request body:', body);
    const { songId } = body;
    console.log('[Debug PATCH] Extracted songId:', songId);
    
    const params = await context.params;
    const jamId = params.id;
    console.log('[Debug PATCH] Context params:', { jamId });

    const jam = await Jam.findById(jamId).populate('songs.song');
    if (!jam) {
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }
    console.log('[Debug PATCH] Found jam:', { 
      jamId: jam._id, 
      songCount: jam.songs.length,
      songs: jam.songs.map(s => ({ id: s.song._id, order: s.order }))
    });

    // Validate songId
    if (!songId) {
      console.log('[Debug PATCH] Invalid songId:', songId);
      return NextResponse.json({ error: 'Invalid songId provided' }, { status: 400 });
    }

    // Check if song already exists in the jam
    const existingSong = jam.songs.find(s => s.song._id.toString() === songId.toString());
    if (existingSong) {
      return NextResponse.json({ 
        error: 'Song already exists in this jam',
        skippedSongs: [songId],
        addedSongs: []
      }, { status: 400 });
    }

    // Add the song to the jam with the next order number
    const nextOrder = jam.songs.length > 0 
      ? Math.max(...jam.songs.map(s => s.order || 0)) + 1 
      : 1;
    console.log('[Debug PATCH] Calculated nextOrder:', nextOrder);
    
    jam.songs.push({ song: songId, votes: 0, order: nextOrder });
    await jam.save();

    // Re-fetch to get the populated song data
    const updatedJam = await Jam.findById(jamId).populate('songs.song');
    const addedSong = updatedJam.songs[updatedJam.songs.length - 1];

    // Broadcast the song addition using Pusher
    await pusherServer.trigger(`jam-${jamId}`, 'song-added', {
      song: addedSong
    });

    // Return the jam and the added song's ID for localStorage
    return NextResponse.json({
      jam: updatedJam,
      addedSongId: addedSong._id,
      addedSongs: [songId],
      skippedSongs: []
    });
  } catch (error) {
    console.error('Error adding song to jam:', error);
    return NextResponse.json({ error: 'Failed to add song to jam' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    const result = await Jam.findByIdAndUpdate(id, { archived: true }, { new: true });

    if (!result) {
      return NextResponse.json(
        { error: 'Jam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving jam:', error);
    return NextResponse.json(
      { error: 'Failed to archive jam' },
      { status: 500 }
    );
  }
} 