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

    const originalSong = await Song.findById(jamSong.song._id);
    if (originalSong) {
      if (newPlayedStatus) {
        // Only add to play history if we're marking as played
        const playHistoryEntry = {
          date: new Date(),
          event: jam.name
        };
        
        // Check if this jam is already in play history to avoid duplicates
        const jamAlreadyInHistory = originalSong.playHistory.some(
          entry => entry.event === jam.name
        );
        
        if (!jamAlreadyInHistory) {
          originalSong.playHistory.push(playHistoryEntry);
        }
      } else {
        // Remove this jam from play history when unmarking
        originalSong.playHistory = originalSong.playHistory.filter(
          entry => entry.event !== jam.name
        );
      }

      // Calculate actual times played from unique jams
      const uniqueJams = new Set(originalSong.playHistory.map(entry => entry.event));
      originalSong.timesPlayed = uniqueJams.size;
      
      // Update last played date
      if (originalSong.playHistory.length > 0) {
        originalSong.lastPlayed = originalSong.playHistory.reduce((latest, entry) => 
          entry.date > latest ? entry.date : latest,
          originalSong.playHistory[0].date
        );
      } else {
        // If no play history, reset lastPlayed to null
        originalSong.lastPlayed = null;
      }
      
      await originalSong.save();
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