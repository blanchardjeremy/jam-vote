// Looks up album art for every song that hasn't been checked yet.
//
// New songs get their art when they're added, so this is for the songs that
// were already in the library. It goes slowly (one song every few seconds) to
// stay under the iTunes Search API's limit of about 20 calls a minute. A song
// whose lookup fails is left unchecked, so running it again picks up where it
// left off.
//
// Usage (dry run on a few songs, then apply to all):
//   MONGODB_URI=mongodb://127.0.0.1:27018/musicluck node scripts/backfill-artwork.mjs --limit 10
//   MONGODB_URI=mongodb://127.0.0.1:27018/musicluck node scripts/backfill-artwork.mjs --apply

import mongoose from 'mongoose';
import { findArtwork } from '../lib/artwork.mjs';

const uri = process.env.MONGODB_URI;
const apply = process.argv.includes('--apply');
const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : 0;

const DELAY_MS = 3500;
const BACKOFF_MS = 60_000;
const MAX_FAILURES_IN_A_ROW = 5;

if (!uri) {
  console.error('Set MONGODB_URI on the command line. This script never reads .env files.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mongoose.connect(uri);
const { host, port, name } = mongoose.connection;
const songs = mongoose.connection.collection('songs');
const filter = { artworkCheckedAt: { $in: [null, undefined] } };
const total = await songs.countDocuments(filter);
const todo = limit ? Math.min(limit, total) : total;
console.log(
  `${apply ? 'Applying to' : 'Dry run on'} ${host}:${port}/${name}: ${todo} of ${total} unchecked songs, ` +
    `about ${Math.ceil((todo * DELAY_MS) / 60000)} minutes\n`
);

let found = 0;
let missed = 0;
let failed = 0;
let failuresInARow = 0;
let i = 0;

const cursor = songs.find(filter, { projection: { title: 1, artist: 1 } }).limit(limit);
for await (const song of cursor) {
  i += 1;
  const label = `[${i}/${todo}] ${song.title} - ${song.artist}`;
  try {
    const { url } = await findArtwork(song.title, song.artist);
    failuresInARow = 0;
    if (url) found += 1;
    else missed += 1;
    console.log(`${label}: ${url || 'no art found'}`);
    if (apply) {
      await songs.updateOne(
        { _id: song._id, artworkCheckedAt: { $in: [null, undefined] } },
        { $set: { artworkUrl: url, artworkCheckedAt: new Date() } }
      );
    }
  } catch (error) {
    failed += 1;
    failuresInARow += 1;
    console.log(`${label}: failed (${error.message}), left for next run`);
    if (failuresInARow >= MAX_FAILURES_IN_A_ROW) {
      console.log(`\n${failuresInARow} failures in a row, stopping. Run again later.`);
      break;
    }
    // Most likely rate limited: wait a minute before going on
    await sleep(BACKOFF_MS);
  }
  await sleep(DELAY_MS);
}

console.log(`\nFound art for ${found}, no art for ${missed}, failed ${failed}.`);
if (!apply) console.log('Dry run: nothing was saved. Add --apply to save.');
await mongoose.disconnect();
