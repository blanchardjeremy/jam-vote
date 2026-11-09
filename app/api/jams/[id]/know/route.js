import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';

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

    const jam = await Jam.findById(jamId);
    if (!jam) {
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }

    const songToUpdate = jam.songs.find(s => s._id.toString() === songId);
    if (!songToUpdate) {
      return NextResponse.json({ error: 'Song not found in jam' }, { status: 404 });
    }

    const current = songToUpdate.knows || 0;
    songToUpdate.knows = action === 'know' ? current + 1 : Math.max(0, current - 1);
    await jam.save();

    await pusherServer.trigger(`jam-${jamId}`, 'know', {
      songId,
      knows: songToUpdate.knows
    });

    return NextResponse.json({ success: true, knows: songToUpdate.knows });
  } catch (error) {
    console.error('[Know API] Error:', error);
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}
