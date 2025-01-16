import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jam from '@/models/Jam';
import { pusherServer } from '@/lib/pusher';

export async function POST(request, context) {
  try {
    console.log('[Captain API] Received captain signup request');
    await connectDB();
    const { name, type } = await request.json();
    const jamId = await context.params.id;
    
    console.log('[Captain API] Request details:', { jamId, name, type });

    const jam = await Jam.findById(jamId);
    if (!jam) {
      console.log('[Captain API] Jam not found:', jamId);
      return NextResponse.json({ error: 'Jam not found' }, { status: 404 });
    }

    // Add the captain to the jam's captains array
    const newCaptain = {
      name,
      type,
      createdAt: new Date()
    };

    jam.captains = jam.captains || [];
    jam.captains.push(newCaptain);
    
    await jam.save();
    console.log('[Captain API] Saved jam successfully');

    // Trigger Pusher event
    console.log('[Captain API] Triggering Pusher event');
    await pusherServer.trigger(`jam-${jamId}`, 'captain-added', {
      captain: newCaptain
    });
    console.log('[Captain API] Pusher event triggered');

    return NextResponse.json({ 
      success: true, 
      captain: newCaptain
    });
  } catch (error) {
    console.error('[Captain API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sign up as captain' },
      { status: 500 }
    );
  }
} 