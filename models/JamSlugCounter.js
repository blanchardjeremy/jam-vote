import mongoose from 'mongoose';

const jamSlugCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export default mongoose.models.JamSlugCounter || mongoose.model('JamSlugCounter', jamSlugCounterSchema); 