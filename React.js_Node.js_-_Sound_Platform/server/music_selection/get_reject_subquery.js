'use strict';

const _ = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;

const logger = require('../logger').main;
const models = require('../models');

function getRejectSubquery(user, toReject, saPreset) {
  const toRejectExplicitly = toReject.map((id) => new ObjectId(id));

  const tracksToExclude = user.lastPlayedIn(saPreset.track_norepeat)
    .concat(toRejectExplicitly);

  const result = {
    _id: { $nin: tracksToExclude }
  };

  const tracksToExcludeArtists = user.lastPlayedIn(saPreset.artist_norepeat)
    .concat(toRejectExplicitly);

  if (!tracksToExcludeArtists.length) {
    return Promise.resolve(result);
  }

  return models.Track
    .find({
      _id: { $in: tracksToExcludeArtists }
    })
    .select('artistName')
    .lean()
    .exec()
    .then((tracks) => _.map(tracks, 'artistName'))
    .then((artistsToEsclude) =>
      Object.assign({}, result, {
        artistName: { $nin: artistsToEsclude }
      })
    )
    .catch((err) => {
      logger.error('failed to get rejectabe tracks data:', err);
      return result;
    });
}

module.exports = getRejectSubquery;
