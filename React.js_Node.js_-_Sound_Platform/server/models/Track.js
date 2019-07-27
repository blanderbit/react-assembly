'use strict';

const mongoose = require('mongoose');

const _ = require('lodash');
const tmp = require('tmp');
const request = require('request');
const Promise = require('bluebird');

const fs = require('fs');

const Track = new mongoose.Schema({
  file: { type: String, required: true },

  state: String,

  title: String,
  artistName: String,
  bpm: Number,
  detectedBpm: Number,
  coverImage: String,
  releaseYear: Number,
  tags: [String],
  genres: [String],

  // data read from ID3 tags
  id3: {
    available: { type: Boolean, default: false },
    bpm: Number,
    artist: String,
    title: String,
    album: String,
    genres: [String],
    year: Number,
    coverImage: String
  },

  spotify: {
    id: String,
    isrc: String,
    noMatch: Boolean
  },

  // data read from various providers (echonest, rdio, spotify, etc)
  providers: {
    image: String, // use best: comes from echonest/track/profile, musicbrains, rdio, spotify or discogs
    images: [String], // all available images
    title: String,
    hotttnesss: Number,

    tags: [String],
    genre: [String],
    genre_normalized: [String],

    bitrate: Number,
    samplerate: Number,

    artist: {
      name: String,
      id: String,
      familiarity: Number,
      hotttnesss: Number
    },
    audio: {
      acousticness: Number,
      danceability: Number,
      duration: Number,
      energy: Number,
      key: Number,
      liveness: Number,
      loudness: Number,
      mode: Number,
      speechiness: Number,
      tempo: Number,
      time_signature: Number,
      valence: Number
    },
    tracks: {
      echo: [String],
      rdio: [String],
      spotify: [String],
      musicbrainz: [String],
      discogs: [String]
    },
    releases: {
      echo: [String],
      rdio: [String],
      spotify: [String],
      musicbrainz: [String],
      discogs: [String]
    },
    releaseYears: [Number],
    releaseName: String,
    songId: String,

    errorMessage: String
  },

  duration: Number
},
  {
    discriminatorKey: 'type'
  });

Track.index({ title: 'text', artistName: 'text' });

Track.virtual('createdDate').get(function() {
  return this._id.getTimestamp();
});

Track.methods.serializeWithUrl = function() {
  var obj = this.toObject({virtuals: true});
  obj.file = this.getUrl();
  return obj;
};

Track.virtual('displayName').get(function() {
  return [this.artistName, this.title]
    .filter(t => !!t).join(' - ');
});

Track.methods.downloadToTmp = function() {
  return new Promise((_resolve, _reject) => {
    const resolve = _.once(_resolve);
    const reject = _.once(_reject);

    tmp.file({ prefix: `${this.id}_`, postfix: '.mp3' }, (err, path) => {
      if (err) return reject(err);

      const fileWriteStream = fs.createWriteStream(path);

      request({
        url: this.getUrl(true),
        headers: {
          'user-agent': 'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405'
        }
      })
        .on('error', (err) => {
          return reject(err);
        })
        .pipe(fileWriteStream);

      fileWriteStream
        .on('finish', () => {
          resolve(path);
        })
        .on('error', (err) => {
          return reject(err);
        });
    });
  });
};

module.exports = mongoose.model('Track', Track);
