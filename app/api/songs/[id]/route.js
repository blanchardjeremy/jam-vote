import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { title, artist, type, chordChart } = await request.json();

    const song = await Song.findByIdAndUpdate(
      id,
      { 
        title,
        artist,
        type,
        chordChart: chordChart || null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Find all jams that contain this song and trigger Pusher events for each
    const jams = await Jam.find({ 'songs.song': id });
    
    for (const jam of jams) {
      await pusherServer.trigger(`jam-${jam._id}`, 'song-edited', {
        songId: id,
        updatedSong: song
      });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
} 