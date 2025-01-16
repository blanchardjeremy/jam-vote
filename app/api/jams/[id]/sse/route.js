import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Create a global store outside of the module scope
const globalStore = {
  clients: new Map(),
  addClient(jamId, writer) {
    if (!this.clients.has(jamId)) {
      this.clients.set(jamId, new Set());
    }
    this.clients.get(jamId).add(writer);
    console.log(`[SSE Global] Added client. Total for jam ${jamId}: ${this.clients.get(jamId).size}`);
  },
  removeClient(jamId, writer) {
    const jamClients = this.clients.get(jamId);
    if (jamClients) {
      jamClients.delete(writer);
      console.log(`[SSE Global] Removed client. Remaining for jam ${jamId}: ${jamClients.size}`);
      if (jamClients.size === 0) {
        this.clients.delete(jamId);
        console.log(`[SSE Global] No more clients for jam ${jamId}, removed jam`);
      }
    }
  },
  getClientsForJam(jamId) {
    return this.clients.get(jamId);
  }
};

export async function GET(request, { params }) {
  const jamId = await params.id;
  console.log(`[SSE] New connection request for jam ${jamId}`);
  console.log(`[SSE] Current active connections for this jam: ${globalStore.getClientsForJam(jamId)?.size || 0}`);

  // Set up SSE headers
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Add this client to our connected clients for this jam
  globalStore.addClient(jamId, writer);

  // Send initial connection message immediately
  try {
    console.log(`[SSE] Sending initial connection message for jam ${jamId}`);
    await writer.write(encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'));
  } catch (e) {
    console.error('[SSE] Error sending initial message:', e);
  }

  // Clean up on disconnect
  request.signal.addEventListener('abort', () => {
    console.log(`[SSE] Client disconnected from jam ${jamId}`);
    globalStore.removeClient(jamId, writer);
    writer.close();
    clearInterval(keepalive);
  });

  // Send keepalive every 5 seconds
  const keepalive = setInterval(async () => {
    try {
      await writer.write(encoder.encode('event: ping\ndata: keepalive\n\n'));
    } catch (e) {
      console.error('[SSE] Error sending keepalive, clearing interval:', e);
      clearInterval(keepalive);
    }
  }, 5000);

  return new NextResponse(stream.readable, {
    headers: responseHeaders,
  });
}

// Helper function to broadcast updates to all connected clients for a jam
export async function broadcastUpdate(jamId, eventType, data) {
  const connectedClients = globalStore.getClientsForJam(jamId);
  console.log(`[SSE] Broadcasting ${eventType} to jam ${jamId}`);
  console.log(`[SSE] Broadcast data:`, data);
  console.log(`[SSE] Number of connected clients: ${connectedClients?.size || 0}`);

  if (!connectedClients) {
    console.log(`[SSE] No connected clients for jam ${jamId}, skipping broadcast`);
    return;
  }

  const encoder = new TextEncoder();
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

  // Send to all connected clients
  let successCount = 0;
  for (const client of connectedClients) {
    try {
      await client.write(encoder.encode(message));
      successCount++;
    } catch (e) {
      console.error(`[SSE] Error broadcasting to client:`, e);
      // Remove failed client
      globalStore.removeClient(jamId, client);
    }
  }
  console.log(`[SSE] Successfully broadcast to ${successCount}/${connectedClients.size} clients`);
} 