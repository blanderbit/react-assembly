'use strict';

const express = require('express');
const _ = require('lodash');

const models = require('../../models');
const fingerprinter = require('../../fingerprinter/soundcloud/fingerprint_individual');
const logger = require('../../logger').main;

const router = new express.Router();

router.param('trackId', (req, res, next, id) => {
  const collection = req.params.collection || 'Track';

  models[collection].findById(id)
    .exec()
    .then((track) => {
      if (!track) {
        res.status(404).send();
        return;
      }

      req.track = track;
      next();
    }, next);
});

router.get('/:collection/count', (req, res) => {
  const collection = req.params.collection;
  const query = {};
  if (req.query.tags) {
    query.tags = { $in: _.isArray(req.query.tags) ? req.query.tags : [req.query.tags] };
  }
  models[collection].count(query)
    .then((count) => {
      res.json({ count });
    })
    .catch((err) => {
      res.status(500).send('Failed to get tracks stats');
      console.error(err.stack);
    });
});

router.get('/:collection/:trackId', (req, res) => {
  res.json(req.track.toObject({ getters: true }));
});

router.get('/:collection', (req, res) => {
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 50;

  const sortObj = {};

  if (req.query.sortKey) {
    let key = req.query.sortKey;
    key = key === 'createdDate' ? '_id' : key;
    sortObj[key] = req.query.sortDirection || 1;
  }

  const collection = req.params.collection;

  const query = {};

  if (req.query.q) {
    Object.assign(query, { $text: { $search: req.query.q } });
  }

  if (req.query.tags) {
    query.tags = { $in: _.isArray(req.query.tags) ? req.query.tags : [req.query.tags] };
  }

  models[collection].find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .exec((err, tracks) => {
      if (err) {
        console.error(err.stack);
        return res.status(500).send();
      }

      tracks = tracks.map((t) => t.serializeWithUrl());

      res.json(tracks);
    });
});

router.post('/:collection/:trackId', (req, res) => {
  const update = _.pick(req.body, ['title', 'artistName', 'bpm',
    'coverImage', 'releaseYear', 'state', 'tags']);

  _.assign(req.track, update);

  req.track.save((err, savedDoc) => {
    if (err) {
      res.status(500).send();
      console.error('Failed to update track %s:\n' + err.stack, req.params.trackId);
      return;
    }

    res.json(savedDoc.toObject({ getters: true }));
  });
});

router.post('/:collection/:trackId/fingerprint', (req, res) => {
  if (req.track.type === 'Song') {
    return res.status(400).send();
  }

  fingerprinter(req.track, (err, track) => {
    if (err) {
      logger.error('Individual fingerprinter: ', err);
      res.status(500).send();
      return;
    }
    res.json(track.toObject({ getters: true }));
  });
});

router.delete('/:collection/:trackId', (req, res) => {
  req.track.state = 'deleted';

  req.track.save((err, saved) => {
    if (err) {
      res.status(500).send();
      console.error('Failed to update track %s:\n' + err.stack, req.params.trackId);
      return;
    }

    res.json(saved.toObject());
  });
});

module.exports = router;
