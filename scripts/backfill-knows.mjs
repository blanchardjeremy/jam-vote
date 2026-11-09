// One-time fix for jams whose hearts were given before "I know it" was counted.
//
// Every heart now also adds a know, so a song's knows should never be lower
// than its loves. In older jams the hearts were never added to knows, so the
// host know bar folds the few knows there are into the loves and shows no
// indigo. For each jam song with fewer knows than loves, this adds the loves
// to the knows. It assumes the knows recorded so far came from people who
// didn't heart the song, so a song can end up a little over-counted if
// someone hearted it after knows started being counted.
//
// Safe to run again: once knows >= loves a song is left alone.
//
// Usage (dry run, then apply):
//   MONGODB_URI=mongodb://127.0.0.1:27018/musicluck node scripts/backfill-knows.mjs
//   MONGODB_URI=mongodb://127.0.0.1:27018/musicluck node scripts/backfill-knows.mjs --apply

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
const apply = process.argv.includes('--apply');

if (!uri) {
  console.error('Set MONGODB_URI on the command line. This script never reads .env files.');
  process.exit(1);
}

await mongoose.connect(uri);
const { host, port, name } = mongoose.connection;
console.log(`${apply ? 'Applying to' : 'Dry run on'} ${host}:${port}/${name}\n`);

const jams = mongoose.connection.collection('jams');
let songsChanged = 0;
let jamsChanged = 0;

for await (const jam of jams.find({}, { projection: { name: 1, slug: 1, songs: 1 } })) {
  const updates = {};
  (jam.songs || []).forEach((s, i) => {
    const votes = s.votes || 0;
    const knows = s.knows || 0;
    if (knows < votes) updates[`songs.${i}.knows`] = knows + votes;
  });
  const count = Object.keys(updates).length;
  if (!count) continue;

  jamsChanged += 1;
  songsChanged += count;
  console.log(`${jam.slug ?? '-'}  ${jam.name}: ${count} songs`);
  if (apply) {
    // Only update if the songs array hasn't been reordered since it was read
    const guard = Object.fromEntries(
      Object.keys(updates).map((path) => {
        const i = Number(path.split('.')[1]);
        return [`songs.${i}._id`, jam.songs[i]._id];
      })
    );
    const res = await jams.updateOne({ _id: jam._id, ...guard }, { $set: updates });
    if (!res.modifiedCount) console.warn(`  skipped: ${jam.name} changed while running, run again`);
  }
}

console.log(`\n${songsChanged} songs in ${jamsChanged} jams ${apply ? 'updated' : 'would be updated'}.`);
await mongoose.disconnect();
