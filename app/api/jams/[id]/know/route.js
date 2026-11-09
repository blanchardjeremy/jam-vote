import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';
import { incrementJamSongCounter } from '@/lib/jamSongCounters';

// Records that someone knows (or no longer says they know) a song in a jam.
// Works like the heart vote in ../vote, but updates the `knows` count.
export async function POST(request, { params }) {
  try {
    await connectDB();
    const { songId, action } = await request.json();
    const jamId = (await params).id;

    if (action !== 'know' && action !== 'unknow') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await incrementJamSongCounter(Jam, jamId, songId, 'knows', action === 'know' ? 1 : -1);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    await pusherServer.trigger(`jam-${jamId}`, 'know', {
      songId,
      knows: result.value
    });

    return NextResponse.json({ success: true, knows: result.value });
  } catch (error) {
    console.error('[Know API] Error:', error);
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}
