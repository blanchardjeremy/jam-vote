import mongoose from 'mongoose';

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
  const lastJam = await this.findOne({}, { slug: 1 }).sort({ slug: -1 });
  if (!lastJam) return '1';
  const lastNumber = parseInt(lastJam.slug, 10);
  return (lastNumber + 1).toString();
};

// Pre-save hook to set the slug
jamSchema.pre('save', async function(next) {
  if (!this.slug) {
    this.slug = await this.constructor.getNextNumber();
  }
  next();
});

export default mongoose.models.Jam || mongoose.model('Jam', jamSchema); 