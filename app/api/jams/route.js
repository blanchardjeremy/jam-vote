import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import Song from '@/models/Song'; // Needed even though it is unused

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();

    // Add order to each song
    const songsWithOrder = (data.songs || []).map((song, index) => ({
      ...song,
      order: index + 1
    }));

    const jam = await Jam.create({
      name: data.name,
      jamDate: data.jamDate,
      songs: songsWithOrder
    });

    return NextResponse.json(jam, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/jams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create jam session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const jams = await Jam.find({})
      .sort({ jamDate: -1, createdAt: -1 })
      .populate('songs.song');

    return NextResponse.json(jams);
  } catch (error) {
    console.error('Error in GET /api/jams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jam sessions' },
      { status: 500 }
    );
  }
} 