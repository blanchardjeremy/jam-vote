# Music Jam Voting

A real-time collaborative platform for managing music jam sessions. Built with Next.js 15, MongoDB, and Pusher for real-time updates.

## Features

- Create and manage jam sessions with dates and song lists
- Add songs with details like title, artist, and type (banger/ballad)
- Real-time voting system for songs
- Track played/unplayed songs during sessions
- Group songs by type (bangers/ballads)
- Sort songs by votes or manually
- Real-time updates across all connected clients
- Chord chart support for songs
- Song history tracking

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Real-time**: Pusher
- **UI Components**:
  - Headless UI
  - Heroicons
  - ShadcnUI

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up environment variables:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   PUSHER_APP_ID=your_pusher_app_id
   PUSHER_KEY=your_pusher_key
   PUSHER_SECRET=your_pusher_secret
   PUSHER_CLUSTER=your_pusher_cluster
   ```

4. Run the development server:

   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js 15 app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and configurations
- `/models` - Mongoose models for MongoDB
- `/styles` - Global styles and Tailwind configuration

## Features in Detail

### Jam Sessions

- Create jam sessions with names and dates
- View list of all jam sessions
- Real-time updates when songs are added/removed/modified

### Songs

- Add existing songs or create new ones
- Categorize songs as bangers or ballads
- Add chord charts and tags
- Track play history and vote counts

### Real-time Collaboration

- Vote on songs in real-time
- Mark songs as played/unplayed
- See updates instantly across all connected clients
- Sort and group songs dynamically

## License

GPL-3.0
