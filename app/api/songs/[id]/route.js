import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/models/Song';

export async function DELETE(request, context) {
  try {
    await connectDB();
    
    const songId = context.params.id;
    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    const song = await Song.findByIdAndDelete(songId);
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/songs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete song' },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    
    const songId = await context.params.id;
    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const song = await Song.findByIdAndUpdate(songId, data, { new: true });
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error in PUT /api/songs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update song' },
      { status: 500 }
    );
  }
} 