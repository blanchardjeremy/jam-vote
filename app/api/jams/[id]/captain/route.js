import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';

export async function POST(request, context) {
  try {
    console.log('[Captain API] Received captain signup request');
    await connectDB();
    const { name, type, songId } = await request.json();
    const params = await context.params;
    const jamId = params.id;
    
    console.log('[Captain API] Request details:', { jamId, name, type, songId });

    const jam = await Jam.findById(jamId);
    if (!jam) {
      console.log('[Captain API] Jam not found:', jamId);
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }

    // Find the song in the jam
    const jamSong = jam.songs.id(songId);
    if (!jamSong) {
      console.log('[Captain API] Song not found in jam:', songId);
      return NextResponse.json({ error: 'Song not found in jam' }, { status: 404 });
    }

    // Check if user is already a captain for this song
    if (jamSong.captains?.some(captain => captain.name === name)) {
      console.log('[Captain API] User is already a captain for this song:', name);
      return NextResponse.json({ 
        error: 'You are already a captain for this song'
      }, { status: 400 });
    }

    // Add the captain to the song's captains array
    const newCaptain = {
      name,
      type,
      createdAt: new Date()
    };

    jamSong.captains = jamSong.captains || [];
    jamSong.captains.push(newCaptain);
    
    await jam.save();
    console.log('[Captain API] Saved jam successfully');

    // Trigger Pusher event
    console.log('[Captain API] Triggering Pusher event');
    await pusherServer.trigger(`jam-${jamId}`, 'captain-added', {
      songId,
      captain: newCaptain
    });
    console.log('[Captain API] Pusher event triggered');

    return NextResponse.json({ 
      success: true, 
      captain: newCaptain
    });
  } catch (error) {
    console.error('[Captain API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sign up as captain' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    console.log('[Captain API] Received captain removal request');
    await connectDB();
    
    // In Next.js 13+, we need to use request.json() for DELETE requests
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');
    const name = searchParams.get('name');
    const jamId = context.params.id;
    
    console.log('[Captain API] Request details:', { jamId, name, songId });

    if (!songId || !name) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const jam = await Jam.findById(jamId);
    if (!jam) {
      console.log('[Captain API] Jam not found:', jamId);
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }

    // Find the song in the jam
    const jamSong = jam.songs.id(songId);
    if (!jamSong) {
      console.log('[Captain API] Song not found in jam:', songId);
      return NextResponse.json({ error: 'Song not found in jam' }, { status: 404 });
    }

    // Remove the captain from the song's captains array
    const captainIndex = jamSong.captains?.findIndex(captain => captain.name === name);
    if (captainIndex === -1) {
      return NextResponse.json({ error: 'You are not a captain for this song' }, { status: 400 });
    }

    const removedCaptain = jamSong.captains[captainIndex];
    jamSong.captains.splice(captainIndex, 1);
    await jam.save();
    console.log('[Captain API] Saved jam successfully');

    // Trigger Pusher event
    console.log('[Captain API] Triggering Pusher event');
    await pusherServer.trigger(`jam-${jamId}`, 'captain-removed', {
      songId,
      captain: removedCaptain
    });
    console.log('[Captain API] Pusher event triggered');

    return NextResponse.json({ 
      success: true, 
      captain: removedCaptain
    });
  } catch (error) {
    console.error('[Captain API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove captain' },
      { status: 500 }
    );
  }
} 