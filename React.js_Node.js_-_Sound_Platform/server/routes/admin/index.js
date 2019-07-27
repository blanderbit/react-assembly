'use strict';

const _ = require('lodash');
const moment = require('moment');
const json2csv = require('json2csv');
const Excel = require('exceljs');
const tmp = require('tmp');
const async = require('async');
const express = require('express');

const router = new express.Router();

const models = require('../../models');

const logger = require('../../logger').main;

const getPlayedEventsQuery = require('../../middleware/get_played_events_query');

const aggregatePlayedEventsByPlayedCount = (req, res, next) => {
  const onError = (err) => {
    logger.error(err);
    res.status(500).send();
  };
  const getMatchingTracks = (coll, ids) => {
    return (cb) => {
      models[coll]
        .find({_id: {$in: ids}})
        .select('title artistName duration spotify')
        .lean()
        .exec(cb);
    };
  };

  models.UserPlayEvent
    .aggregate()
    .match(req.playedEventsQuery)
    .group({_id: '$trackId', num: {$sum: 1}, trackTitle: {$last: '$trackName'}})
    .exec((err, result) => {
      if (err) return onError(err);
      const ids = _.map(result, '_id');
      async.parallel([
        getMatchingTracks('SoundcloudSong', ids),
        getMatchingTracks('Song', ids),
        getMatchingTracks('PitchedTrack', ids)
      ], (err, tracksResults) => {
        if (err) return onError(err);
        const allResults = tracksResults[0].concat(tracksResults[1]).concat(tracksResults[2]);
        const sortKey = req.query.sortKey || 'num';
        const sortDir = req.query.sortDirection ? parseInt(req.query.sortDirection, 10) : -1;
        req.playedTracksByPlayedCount = _(result)
          .map((aggregateResult) => {
            const matchingTrack = _.find(allResults, (track) => track._id.equals(aggregateResult._id));
            if (matchingTrack) {
              _.assign(
                aggregateResult,
                _.pick(matchingTrack, 'artistName', 'title', 'duration'),
                { isrc: _.get(matchingTrack, 'spotify.isrc') }
              );
            } else {
              aggregateResult.noMatch = true;
            }
            return aggregateResult;
          })
          .sortBy(sortKey)
          .value();
        if (sortDir === -1) req.playedTracksByPlayedCount.reverse();

        next(null);
      });
    });
};

router.get('/play_events', getPlayedEventsQuery, aggregatePlayedEventsByPlayedCount, (req, res) => {
  res.json(req.playedTracksByPlayedCount);
});

router.get('/play_events/csv', getPlayedEventsQuery, aggregatePlayedEventsByPlayedCount, (req, res) => {
  const data = req.playedTracksByPlayedCount.map((event) => {
    return {
      artistName: event.artistName,
      title: event.title,
      num: event.num,
      duration: event.duration,
      isrc: event.isrc
    };
  });

  json2csv({
    data: data,
    fields: ['artistName', 'title', 'duration', 'num', 'isrc'],
    fieldNames: ['Artist', 'Title', 'Duration, s', 'Play count', 'ISRC']
  },
    function(err, csv) {
      if (err) {
        console.error(err.stack);
        return res.status(500).send();
      }

      const fmt = 'YYYY-MM-DD';
      const startDateFmtd = moment(req.query.startDate).format(fmt);
      const endDateFmtd = moment(req.query.startDate).format(fmt);

      res.type('csv');
      res.set('Content-Disposition', `filename="songs_played_report_${startDateFmtd}-${endDateFmtd}.csv"`);
      res.send(csv);
    });
});

router.get('/play_events/xlsx', getPlayedEventsQuery, aggregatePlayedEventsByPlayedCount, (req, res) => {
  var workbook = new Excel.Workbook();

  var sheet = workbook.addWorksheet('Played tracks');

  sheet.columns = [
    {header: 'Artist', key: 'artistName', width: 40},
    {header: 'Title', key: 'title', width: 60},
    {header: 'Duration, s', key: 'duration', width: 20},
    {header: 'Play count', key: 'num', width: 15},
    {header: 'ISRC', key: 'isrc', width: 30},
  ];

  req.playedTracksByPlayedCount.forEach((event) => {
    var row = {
      artistName: event.artistName,
      title: event.title,
      num: event.num,
      duration: event.duration,
      isrc: event.isrc
    };

    sheet.addRow(row);
  });

  sheet.getRow(1).font = {bold: true};

  tmp.tmpName(function(err, path) {
    if (err) {
      logger.error('Error creating tmp filename:\n', err);
      res.status(500).send();
      return;
    }

    workbook.xlsx.writeFile(path)
      .then(
        function() {
          const fmt = 'YYYY-MM-DD';
          const startDateFmtd = moment(req.query.startDate).format(fmt);
          const endDateFmtd = moment(req.query.startDate).format(fmt);
          res.download(path, `songs_played_report_${startDateFmtd}-${endDateFmtd}.xlsx`);
        },
        function(err) {
          logger.error('Error writing xlsx workbook:\n', err);
          res.status(500).send();
        }
      );
  });
});

router.use('/bpm_table', require('./bpm_table'));
router.use('/users', require('./users'));
router.use('/tracks', require('./tracks'));
router.use('/sa-presets', require('./saPresets'));

module.exports = router;
