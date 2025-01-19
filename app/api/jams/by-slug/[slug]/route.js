import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import Song from '@/models/Song';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    const { slug } = params;

    const jam = await Jam.findOne({ slug }).populate('songs.song');

    if (!jam) {
      return NextResponse.json(
        { error: 'Jam not found' },
        { status: 404 }
      );
    }

    // Sort the songs by votes in descending order
    jam.songs.sort((a, b) => b.votes - a.votes);

    return NextResponse.json(jam);
  } catch (error) {
    console.error('Error in GET /api/jams/by-slug/[slug]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jam' },
      { status: 500 }
    );
  }
} 