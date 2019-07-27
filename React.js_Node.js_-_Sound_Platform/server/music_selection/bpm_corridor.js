const _ = require('lodash');
const { Preset } = require('../models');
const logger = require('../logger').main;

const {
  BPM_TABLE,
  MOOD_RANGE,
  MOOD_CHANGE_STEP,
  TIME_SLOTS
} = require('../dicts/bpm');

async function findBPMCorridor(business_type, targetDate, mood) {
  const hour = targetDate.getHours();

  let timeSlotIndex = _.findIndex(TIME_SLOTS, (slot) => slot(hour));

  if (timeSlotIndex === -1) {
    logger.warn(`Haven't found time slot index for business_type ${business_type}, hour ${hour}`);
    timeSlotIndex = 3;
  }

  const preset = await Preset.findOne({ business_type }).exec();

  let corridor;
  if (preset && preset.bpmCorridor && preset.bpmCorridor[timeSlotIndex]) {
    corridor = preset.bpmCorridor[timeSlotIndex];
    // logger.info(`Found preset for business_type ${business_type}, hour ${hour} in the db`);
  } else {
    corridor = BPM_TABLE[business_type][timeSlotIndex];
    // logger.info(`Taking default preset for business_type ${business_type}, hour ${hour}`);
  }

  return {
    min: corridor.base + corridor.low + deltaTune(mood),
    max: corridor.base + corridor.high + deltaTune(mood)
  };
}

function deltaTune(mood) {
  if (MOOD_RANGE.min <= mood && mood <= MOOD_RANGE.max) {
    return mood * MOOD_CHANGE_STEP;
  }
  return 0;
}

const BPM_TABLES_WITH_OVERRIDES = async () => {
  const presets = await Preset
    .find()
    .lean()
    .exec();

  return Object.keys(BPM_TABLE).map((business_type) => {
    const override = _.find(presets, { business_type });
    return ({
      business_type,
      bpmCorridor: override ? override.bpmCorridor : BPM_TABLE[business_type],
      default: !override
    });
  });
};

module.exports.findBPMCorridor = findBPMCorridor;
module.exports.BPM_TABLES_WITH_OVERRIDES = BPM_TABLES_WITH_OVERRIDES;
