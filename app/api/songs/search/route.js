import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    await connectDB();

    // Create case-insensitive regex for fuzzy matching
    const searchRegex = new RegExp(query.split('').join('.*'), 'i');

    const songs = await Song.find({
      $or: [
        { title: { $regex: searchRegex } },
        { artist: { $regex: searchRegex } }
      ]
    })
    .limit(5)
    .lean();

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error in search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 