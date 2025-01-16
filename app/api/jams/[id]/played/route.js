import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import Song from '@/models/Song';
import { pusherServer } from '@/lib/pusher';

export async function POST(request, context) {
  try {
    await connectDB();
    const { songId } = await request.json();
    const params = await context.params;
    const jamId = params.id;

    const jam = await Jam.findById(jamId).populate('songs.song');
    if (!jam) {
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }

    // Find the song in the jam's songs array
    const jamSong = jam.songs.find(s => s._id.toString() === songId);
    if (!jamSong) {
      return NextResponse.json({ error: 'Song not found in jam' }, { status: 404 });
    }

    // Toggle the played status
    const newPlayedStatus = !jamSong.played;
    jamSong.played = newPlayedStatus;

    // If marking as played (not unplaying), update the original song's play history
    if (newPlayedStatus) {
      const originalSong = await Song.findById(jamSong.song._id);
      if (originalSong) {
        // Update play count and last played date
        originalSong.timesPlayed = (originalSong.timesPlayed || 0) + 1;
        originalSong.lastPlayed = new Date();
        
        // Add to play history
        originalSong.playHistory.push({
          date: new Date(),
          event: jam.name // Store the jam name as the event
        });
        
        await originalSong.save();
      }
    }

    await jam.save();

    // Broadcast the update using Pusher
    await pusherServer.trigger(`jam-${jamId}`, 'song-played', {
      songId,
      played: jamSong.played
    });

    return NextResponse.json({ success: true, played: jamSong.played });
  } catch (error) {
    console.error('Error updating song played status:', error);
    return NextResponse.json(
      { error: 'Failed to update song played status' },
      { status: 500 }
    );
  }
} 