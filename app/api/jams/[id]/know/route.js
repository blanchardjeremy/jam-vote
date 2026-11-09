import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';
import { incrementJamSongCounter } from '@/lib/jamSongCounters';

// Records that someone knows a song in a jam, or doesn't (and takes either back).
// Works like the heart vote in ../vote, but updates the `knows` or `dontKnows` count.
const ACTIONS = {
  know: { field: 'knows', delta: 1 },
  unknow: { field: 'knows', delta: -1 },
  dontknow: { field: 'dontKnows', delta: 1 },
  undontknow: { field: 'dontKnows', delta: -1 },
};

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { songId, action } = await request.json();
    const jamId = (await params).id;

    const change = Object.hasOwn(ACTIONS, action) ? ACTIONS[action] : null;
    if (!change) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await incrementJamSongCounter(Jam, jamId, songId, change.field, change.delta);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Only the count that changed is sent
    await pusherServer.trigger(`jam-${jamId}`, 'know', {
      songId,
      [change.field]: result.value
    });

    return NextResponse.json({ success: true, [change.field]: result.value });
  } catch (error) {
    console.error('[Know API] Error:', error);
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}
