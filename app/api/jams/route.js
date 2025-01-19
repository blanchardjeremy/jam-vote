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

    let jam;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        jam = await Jam.create({
          name: data.name,
          jamDate: data.jamDate,
          songs: songsWithOrder
        });
        break; // If successful, exit the loop
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.slug) {
          // Duplicate slug error, retry
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to create jam with unique slug after maximum attempts');
          }
          continue;
        }
        throw error; // For other errors, throw immediately
      }
    }

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
    const jams = await Jam.find({ archived: false })
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