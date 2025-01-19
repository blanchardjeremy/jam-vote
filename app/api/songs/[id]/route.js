import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';

export async function DELETE(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    
    const songId = params.id;
    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // First, find all jams that contain this song
    const jams = await Jam.find({ 'songs.song': songId });

    // For each jam, remove the song and notify clients
    for (const jam of jams) {
      // Remove the song from the jam's songs array
      jam.songs = jam.songs.filter(s => s.song.toString() !== songId);
      await jam.save();

      // Notify clients about the song removal
      await pusherServer.trigger(`jam-${jam._id}`, 'song-removed', {
        songId: songId
      });
    }

    // Finally, delete the song itself
    const song = await Song.findByIdAndDelete(songId);
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/songs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete song' },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    const songId = params.id;
    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const song = await Song.findByIdAndUpdate(songId, data, { new: true });
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error in PUT /api/songs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update song' },
      { status: 500 }
    );
  }
} 