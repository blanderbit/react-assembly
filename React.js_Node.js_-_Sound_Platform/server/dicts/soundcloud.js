'use strict';

const musicFlavor = require('./music_flavor');
/**
 * This module contains some constants and other information concerning
 * SoundCloud songs
 */

module.exports.PLAYLIST_IDS = [
  '103153902', // Berlin
  '333176815', // Berlin2
  '102853481', // Stockholm
  '331203045', // Stockholm2
  '102853290', // NYC
  '88032683', // Paris
  '52114446', // Secret
  '238301431', // Miami
  '128005607', // New Orleans,
  '275974766', // Secret2
  '275968401', // NYC2
  '188161901', // stbarths,
  '360664926', // Fitness,
  '510454212' // Secret --- Fitness 120
];

const tagsMap = [
  { re: /berlin/i, tag: 'berlin' },
  { re: /nyc/i, tag: 'nyc' },
  { re: /paris/i, tag: 'paris' },
  { re: /stockholm/i, tag: 'stockholm' },
  { re: /miami/i, tag: 'miami' },
  { re: /NewOrleans/i, tag: 'new_orleans' },
  { re: /Barths/i, tag: 'st_barths' },
  { re: /Fitness\s*130/i, tag: 'fitness_max' },
  { re: /Fitness\s*120/i, tag: 'fitness_mid' }
];

/**
 * Returns tags by playlist entity obtained from SoundCloud
 * @param  {Object} playlist
 * @return {Array}  array of tags
 */
module.exports.getTags = (playlist) => {
  let tags = [];

  tagsMap.forEach((map) => {
    if (map.re.test(playlist.title)) {
      tags.push(map.tag);
    }
  });

  tags = (tags.length > 0 ? tags : musicFlavor.DEFAULT_FLAVORS.slice());
  tags.push(musicFlavor.SC_TAG);

  return tags;
};
