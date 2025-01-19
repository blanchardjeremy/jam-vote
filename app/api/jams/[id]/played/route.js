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
    // Set or clear playedAt timestamp based on played status
    jamSong.playedAt = newPlayedStatus ? new Date() : null;
    
    console.log('[Played API] Updated jamSong:', {
      songId,
      played: jamSong.played,
      playedAt: jamSong.playedAt
    });

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

    // First update the specific song
    const updatedJam = await Jam.findOneAndUpdate(
      { 
        _id: jamId,
        'songs._id': songId 
      },
      { 
        $set: { 
          'songs.$.played': newPlayedStatus,
          'songs.$.playedAt': newPlayedStatus ? new Date() : null
        } 
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('songs.song');

    // Log warning if we find any inconsistencies
    if (updatedJam) {
      const inconsistentSongs = updatedJam.songs.filter(s => s.played && !s.playedAt);
      if (inconsistentSongs.length > 0) {
        console.log('[Played API] Warning: Found songs marked as played without playedAt timestamp:', 
          inconsistentSongs.map(s => ({
            _id: s._id.toString(),
            title: s.song.title,
            artist: s.song.artist
          }))
        );
      }
    }

    if (!updatedJam) {
      throw new Error('Failed to update jam');
    }

    // Broadcast the update using Pusher
    const updatedSong = updatedJam.songs.find(s => s._id.toString() === songId);
    await pusherServer.trigger(`jam-${jamId}`, 'song-played', {
      songId,
      played: updatedSong.played,
      playedAt: updatedSong.playedAt
    });

    return NextResponse.json({ success: true, played: updatedSong.played });
  } catch (error) {
    console.error('Error updating song played status:', error);
    return NextResponse.json(
      { error: 'Failed to update song played status' },
      { status: 500 }
    );
  }
} 