import { NextResponse, after } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';
import { artworkFields } from '@/lib/songArtwork';

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

    // Art set or removed by hand is kept as is. Otherwise a new title or
    // artist gets its art looked up again.
    if ('artworkUrl' in data) {
      data.artworkUrl = data.artworkUrl?.trim() || null;
      data.artworkCheckedAt = new Date();
    } else if (data.title !== undefined || data.artist !== undefined) {
      const current = await Song.findById(songId, 'title artist').lean();
      const title = data.title ?? current?.title;
      const artist = data.artist ?? current?.artist;
      if (current && (title !== current.title || artist !== current.artist)) {
        Object.assign(data, await artworkFields(title, artist));
      }
    }

    const song = await Song.findByIdAndUpdate(songId, data, { new: true });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Tell everyone looking at a jam with this song, so an edit (like a host
    // moving it between Bangers and Ballads) shows up on their phones too.
    // This runs after the response is sent, so the save doesn't wait on
    // Pusher. A failed notice doesn't fail the save.
    after(async () => {
      try {
        const jams = await Jam.find({ 'songs.song': songId }, '_id').lean();
        const channels = jams.map((jam) => `jam-${jam._id}`);
        // Pusher takes up to 100 channels per call
        for (let i = 0; i < channels.length; i += 100) {
          await pusherServer.trigger(channels.slice(i, i + 100), 'song-edited', {
            songId,
            updatedSong: song,
          });
        }
      } catch (error) {
        console.error('[Song PUT] Failed to send song-edited:', error);
      }
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error in PUT /api/songs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update song' },
      { status: 500 }
    );
  }
} 