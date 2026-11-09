import mongoose from 'mongoose';

// Atomically add `delta` (+1 or -1) to a numeric field on one song in a jam,
// never going below 0.
//
// This is a single database update instead of load → modify → jam.save().
// With save(), two requests touching the same jam at the same moment (e.g. a
// captain sign-up and a "know" from the guided picker, or two people voting)
// could fail with a Mongoose VersionError or overwrite each other's change.
//
// Returns { value } with the new count, or { error } if the jam/song is missing.
export async function incrementJamSongCounter(Jam, jamId, jamSongId, field, delta) {
  if (!mongoose.isValidObjectId(jamId) || !mongoose.isValidObjectId(jamSongId)) {
    return { error: 'Song not found in jam' };
  }

  const songMatch = delta < 0
    ? { _id: jamSongId, [field]: { $gt: 0 } } // only decrement counts above 0
    : { _id: jamSongId };

  const updated = await Jam.findOneAndUpdate(
    { _id: jamId, songs: { $elemMatch: songMatch } },
    { $inc: { [`songs.$.${field}`]: delta } },
    { new: true, projection: { songs: { $elemMatch: { _id: jamSongId } } } }
  ).lean();

  if (updated?.songs?.[0]) {
    return { value: updated.songs[0][field] || 0 };
  }

  // Nothing was updated: either the count was already 0, or the song/jam is missing
  const existing = await Jam.findOne(
    { _id: jamId, 'songs._id': jamSongId },
    { songs: { $elemMatch: { _id: jamSongId } } }
  ).lean();

  if (!existing?.songs?.[0]) {
    return { error: 'Song not found in jam' };
  }
  return { value: existing.songs[0][field] || 0 };
}
