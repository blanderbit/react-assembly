'use strict';

var fs = require('fs')
var Promise = require('bluebird');
var path = require('path');
var p = path.join(__dirname, '../', '.env');
var async = require('async');
var _ = require('lodash');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var expect = require('chai').expect;

var models = require('../server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI);


const Client = require('../server/fingerprinter/clients/spotify_client');
const client = new Client();

// client.searchTracks('track:Endlessly artist:Tess')
//   .then((data) => {
//     console.log(JSON.stringify(data.body, null, 2))
//   })


models.SoundcloudSong.find({spotify: {$exists: false}})
// .select('title artistName')
// .lean()
.sort({_id: -1})
// .limit(10)
.exec(function(err, songs) {
  if (err) throw err;

  async.eachLimit(
    songs,

    10,

    (song, cb) => {
      client.searchTracks(`track:${song.title} artist:${song.artistName}`, {limit: 50})
        .then((data) => {

          const items = _.sortBy(data.body.tracks.items || [], 'popularity').reverse();
          if (!items || items.length === 0) {
            return;
          }

          const havingExactMatch = _.filter(items, (item) => (
            (_.first(item.artists).name || '').toLowerCase().trim() === song.artistName.toLowerCase().trim() &&
              (item.name || '').toLowerCase() === song.title.toLowerCase() &&
              _.get(item, 'external_ids.isrc')
          ));

          if (havingExactMatch.length) {
            return _.first(havingExactMatch);
          }

          const havingIsrc = _.filter(items, 'external_ids.isrc');
          return _.first(havingIsrc);

          return;
        })
        .catch((err) => {
          console.log('Req error', err);
        })
        .then((item) => {
          if (!item) {
            song.spotify.noMatch = true;
            console.log(`song ${song.displayName}: no match`)
          } else {
            song.spotify.id = item.id;
            song.spotify.isrc = item.external_ids.isrc;
            console.log(`song ${song.displayName}: match`)
          }

          return song.save();
        })
        .catch((err) => {
          console.log(err.stack);
        })
        .finally(() => {
          cb(null)
        });
    },

    (err) => {
      console.log(err);
      models.disconnect();
    }

  );
});
