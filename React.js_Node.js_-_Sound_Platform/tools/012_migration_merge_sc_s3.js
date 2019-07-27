'use strict';

const fs = require('fs');

const path = require('path');

const p = path.join(__dirname, '../', '.env');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const logger = require('../server/logger').main;
const client = require('mongodb').MongoClient;

let dbInstance;

client.connect(process.env.MONGOLAB_URI)
  .then((db) => {
    dbInstance = db;
    const songs = db.collection('songs');
    return songs.find().toArray();
  })
  .then((docs) => {
    return dbInstance.collection('tracks')
      .insert(
        docs.map((doc) => Object.assign({}, doc, {
          tags: doc.tags.concat(['mainstream']),
          type: 'Song'
        }))
      );
  })
  .then(() => {
    const songs = dbInstance.collection('soundcloudsongs');
    return songs.find().toArray();
  })
  .then((docs) => {
    return dbInstance.collection('tracks')
      .insert(
        docs.map((doc) => Object.assign({}, doc, {
          tags: doc.tags.concat(['indie']),
          type: 'SoundcloudSong'
        }))
      );
  })
  .catch((err) => {
    logger.error(err);
  })
  .then(() => {
    dbInstance.close();
  });
