import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';
import { incrementJamSongCounter } from '@/lib/jamSongCounters';

export async function POST(request, { params }) {
  try {
    console.log('[Vote API] Received vote request');
    await connectDB();
    const { songId, action, silent } = await request.json();
    const jamId = (await params).id;
    
    console.log('[Vote API] Request details:', { jamId, songId, action, silent });

    if (action !== 'vote' && action !== 'unvote') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Single atomic update, so simultaneous votes can't clash or overwrite each other
    const result = await incrementJamSongCounter(Jam, jamId, songId, 'votes', action === 'vote' ? 1 : -1);
    if (result.error) {
      console.log('[Vote API] Song not found in jam:', songId);
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    const votes = result.value;

    console.log('[Vote API] New votes:', votes);

    // Trigger Pusher event instead of SSE
    console.log('[Vote API] Triggering Pusher event');
    await pusherServer.trigger(`jam-${jamId}`, 'vote', {
      songId,
      votes,
      silent
    });
    console.log('[Vote API] Pusher event triggered');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Vote API] Error:', error);
    return NextResponse.json({ error: 'Failed to vote for song' }, { status: 500 });
  }
} 