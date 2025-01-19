import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';

export async function POST(request, { params }) {
  try {
    console.log('[Vote API] Received vote request');
    await connectDB();
    const { songId, action, silent } = await request.json();
    const jamId = (await params).id;
    
    console.log('[Vote API] Request details:', { jamId, songId, action, silent });

    const jam = await Jam.findById(jamId);
    if (!jam) {
      console.log('[Vote API] Jam not found:', jamId);
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }

    // Find the song in the jam's songs array
    const songToUpdate = jam.songs.find(s => s._id.toString() === songId);
    if (!songToUpdate) {
      console.log('[Vote API] Song not found in jam:', songId);
      return NextResponse.json({ error: 'Song not found in jam' }, { status: 404 });
    }

    console.log('[Vote API] Current votes:', songToUpdate.votes);

    // Update votes based on action
    if (action === 'vote') {
      songToUpdate.votes += 1;
    } else if (action === 'unvote') {
      songToUpdate.votes = Math.max(0, songToUpdate.votes - 1);
    }

    console.log('[Vote API] New votes:', songToUpdate.votes);
    
    await jam.save();
    console.log('[Vote API] Saved jam successfully');

    // Trigger Pusher event instead of SSE
    console.log('[Vote API] Triggering Pusher event');
    await pusherServer.trigger(`jam-${jamId}`, 'vote', {
      songId,
      votes: songToUpdate.votes,
      silent
    });
    console.log('[Vote API] Pusher event triggered');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Vote API] Error:', error);
    return NextResponse.json({ error: 'Failed to vote for song' }, { status: 500 });
  }
} 