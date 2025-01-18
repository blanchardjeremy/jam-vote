import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export async function GET() {
  try {
    await connectDB();
    const songs = await Song.find({});
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
    const song = await Song.create(data);
    return NextResponse.json(song);
  } catch (error) {
    console.error('Error in POST /api/songs:', error);
    return NextResponse.json(
      { error: error.message, details: error.toString() }, 
      { status: 500 }
    );
  }
} 