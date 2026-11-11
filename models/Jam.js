import mongoose from 'mongoose';
import JamSlugCounter from './JamSlugCounter';

const captainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['regular', 'piano'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

const jamSongSchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  order: {
    type: Number,
    required: false
  },
  votes: {
    type: Number,
    default: 0,
    required: false
  },
  played: {
    type: Boolean,
    default: false,
    required: false
  },
  playedAt: {
    type: Date,
    default: null,
    required: false
  },
  captains: [captainSchema]
});

const jamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: false,
    unique: true
  },
  jamDate: {
    type: Date,
    required: true
  },
  archived: {
    type: Boolean,
    default: false,
    required: true
  },
  songs: [jamSongSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Static method to get the next available number
jamSchema.statics.getNextNumber = async function() {
  // First try to find and increment the counter
  const counter = await JamSlugCounter.findByIdAndUpdate(
    'jamSlug',
    { $inc: { seq: 1 } },
    { 
      new: true // Return the updated value
    }
  );

  if (!counter) {
    // If no counter exists, create it starting at 1
    const newCounter = await JamSlugCounter.create({
      _id: 'jamSlug',
      seq: 1
    });
    return newCounter.seq.toString();
  }
  
  return counter.seq.toString();
};

// Pre-save hook to set the slug
jamSchema.pre('save', async function(next) {
  if (!this.slug) {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        // Get the next number
        this.slug = await this.constructor.getNextNumber();
        
        // Check if this slug is already in use
        const existingJam = await this.constructor.findOne({ slug: this.slug });
        if (!existingJam) {
          break; // Slug is available, proceed with save
        }
        
        attempts++;
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          next(error); // If we're out of attempts, pass the error
          return;
        }
        attempts++;
      }
    }
    
    if (attempts === maxAttempts) {
      next(new Error('Failed to generate unique slug after maximum attempts'));
      return;
    }
  }
  next();
});

export default mongoose.models.Jam || mongoose.model('Jam', jamSchema); 