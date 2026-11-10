import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  artist: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['banger', 'ballad'],
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  chordChart: {
    type: String,
    trim: true,
  },
  // Album art found by lib/artwork.mjs, or set by hand in the Edit Song form.
  // artworkCheckedAt is set once a lookup got an answer (art or no art), or
  // the art was set by hand, so a song is never searched again unless its
  // title or artist changes.
  artworkUrl: {
    type: String,
    trim: true,
    default: null,
  },
  artworkCheckedAt: {
    type: Date,
    default: null,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  timesPlayed: {
    type: Number,
    default: 0,
  },
  lastPlayed: {
    type: Date,
    default: null,
  },
  playHistory: [{
    date: {
      type: Date,
      required: true,
    },
    event: {
      type: String,
      trim: true,
    }
  }],
}, {
  timestamps: true,
});

// Add text index for search/autocomplete
songSchema.index({ title: 'text', artist: 'text' });

export default mongoose.models.Song || mongoose.model('Song', songSchema); 