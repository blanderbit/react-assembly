'use strict';

const express = require('express');

const bpm = require('../../music_selection/bpm_corridor');
const models = require('../../models');

const router = new express.Router();

router.get('/', function(req, res) {
  bpm.BPM_TABLES_WITH_OVERRIDES()
    .then(function(tables) {
      res.json(tables);
    })
    .catch(function() {
      res.status(500).send();
    });
});

router.post('/:businessType', function(req, res) {
  models.Preset.update({business_type: req.params.businessType},
    req.body, {upsert: true})
    .exec(function(err, updated) {
      if (err) return res.status(500).send();

      res.send();
    });
});

module.exports = router;
