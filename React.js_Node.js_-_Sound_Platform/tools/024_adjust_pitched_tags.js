/**
 * https://bitbucket.org/jseberg/soundsuitnow2/issues/207
 * DB | Overwrite all "120BPM-pitched" AND "130BPM-pitched" songs tagged with "Miami" with new tags
 *
 * If a "120BPM-pitched" song is tagged with "Miami", overwrite the "Miami" tag with "FitnessMid"
 *
 * If a "130BPM-pitched" song is tagged with "Miami", overwrite the "Miami" tag with "FitnessMax"
 *
 * If a "120BPM-pitched" song is tagged with "Miami" and already "FitnessMax",
 * just kill/delete the "Miami" tag (and keep the "FitnessMax")
 */

const fs = require('fs');
const path = require('path');

const Promise = require('bluebird');
const _ = require('lodash');

const p = path.join(__dirname, '../', '.env');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');

models.connect(process.env.MONGOLAB_URI);

models.PitchedTrack
  .find({ bpm: { $in: [120, 130] }, tags: 'miami' })
  .exec()
  .then((tracks) => Promise.all(tracks.map(processTrack)))
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    models.disconnect();
  });


function processTrack(track) {
  switch (track.bpm) {
    case 120:
      return process120(track);
    case 130:
      return process130(track);
    default:
      console.log(`Don\`t know how to handle ${track.bpm} of ${track.id}`);
      return Promise.resolve();
  }
}

function process120(track) {
  const oldTags = track.tags.slice();
  track.tags = _.union(_.without(track.tags, 'miami'), ['fitness_mid']);
  // console.log(oldTags, track.tags)
  return track.save();
}

function process130(track) {
  const oldTags = track.tags.slice();
  track.tags = _.union(_.without(track.tags, 'miami'), ['fitness_max']);
  // console.log(oldTags, track.tags)
  return track.save();
}
