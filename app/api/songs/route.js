import { NextResponse, after } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';
import { artworkFields, fillMissingArtwork } from '@/lib/songArtwork';

export async function GET() {
  try {
    await connectDB();
    const songs = await Song.find({});
    // Retry art for songs whose lookup failed when they were added. Newest
    // first, since older songs are left to the backfill script.
    after(() => fillMissingArtwork([...songs].reverse()));
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error in GET /api/songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const artwork = data.artworkUrl
      ? { artworkCheckedAt: new Date() }
      : await artworkFields(data.title, data.artist);
    const song = await Song.create({ ...data, ...artwork });
    return NextResponse.json(song);
  } catch (error) {
    console.error('Error in POST /api/songs:', error);
    return NextResponse.json(
      { error: error.message, details: error.toString() }, 
      { status: 500 }
    );
  }
} 