/**
 * Contains mapping between directories and system music flavors
 * @type {{mp3_africa: string, mp3_paris: string, mp3_nordics: string, mp3_nyc: string, mp3_berlin: string, mp3_brasil: string}}
 */
var TAG_MAPPING = {
  'mp3_africa': 'africa',
  'mp3_paris': 'paris',
  'mp3_nordics': 'nordics',
  'mp3_nyc': 'nyc',
  'mp3_berlin': 'berlin',
  'mp3_brasil': 'brasil',
  'mp3_miami': 'miami',
  'mp3_oldies': 'oldies',
  'mp3_neworleans': 'new_orleans',
  'mp3_christmas': 'christmas',
  'mp3_fitnessmax': 'fitness_max'
};

const ALL_FLAVORS = Object.keys(TAG_MAPPING)
  .map((m) => TAG_MAPPING[m])
  .concat(['stockholm', 'classic_mix']);

module.exports = {
  DEFAULT_FLAVORS: ['classic_mix'],
  S3_TAG: 'mainstream',
  SC_TAG: 'indie',
  TAG_MAPPING,
  ALL_FLAVORS
};
