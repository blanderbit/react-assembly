'use strict';

const _ = require('lodash');

const router = new require('express').Router();

const models = require('../../models');
const logger = require('../../logger').main;

function setPresetToReq(req, res, next) {
  models.SearchAlgorithmPreset.getActual()
    .then((preset) => {
      req.preset = preset;
      next();
    })
    .catch((err) => {
      logger.error('Failed to SearchAlgorithmPreset#getActual: ', err);
      res.send(500);
    });
}

router.use(setPresetToReq);

function saPresetParams(params) {
  return _.pick(params, ['artist_norepeat', 'track_norepeat']);
}

router.get('/current', (req, res) => {
  res.json(req.preset.toJson());
});

router.post('/current', (req, res) => {
  Object.assign(req.preset, saPresetParams(req.body));
  req.preset.save()
    .then((saved) => {
      res.json(saved.toJson());
    })
    .catch((err) => {
      logger.error('Failed to save saPreset: ', err);
      res.status(500).send();
    });
});


module.exports = router;
