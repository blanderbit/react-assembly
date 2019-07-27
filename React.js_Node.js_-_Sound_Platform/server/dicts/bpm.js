// time slots check functions
var TIME_SLOTS = [
  function(hour) { return hour >= 22; },
  function(hour) { return hour >= 0 && hour < 6; },
  function(hour) { return hour >= 6 && hour < 9; },
  function(hour) { return hour >= 9 && hour < 12; },
  function(hour) { return hour >= 12 && hour < 14; },
  function(hour) { return hour >= 14 && hour < 17; },
  function(hour) { return hour >= 17 && hour < 20; },
  function(hour) { return hour >= 20 && hour < 22; }
];

// bpm tables for various business types and time slots
// each entry has matching function to match time slot
var BPM_TABLE = {

  "wellness_spa": [
    { base: 40, high: 20, low: -30 },
    { base: 40, high: 20, low: -30 },
    { base: 40, high: 20, low: -10 },
    { base: 50, high: 20, low: -10 },
    { base: 50, high: 20, low: -10 },
    { base: 50, high: 10, low: -20 },
    { base: 60, high: 20, low: -10 },
    { base: 50, high: 20, low: -20 }
  ],

  "restaurant": [
    { base: 60, high: 20, low: -20 },
    { base: 60, high: 20, low: -20 },
    { base: 50, high: 20, low: -10 },
    { base: 60, high: 20, low: -10 },
    { base: 70, high: 10, low: -20 },
    { base: 70, high: 30, low: -20 },
    { base: 90, high: 30, low: -10 },
    { base: 70, high: 40, low: -10 }
  ],

  "hotel": [
    { base: 50, high: 10, low: -30 },
    { base: 50, high: 10, low: -30 },
    { base: 60, high: 20, low: -20 },
    { base: 70, high: 20, low: -20 },
    { base: 80, high: 30, low: -10 },
    { base: 80, high: 20, low: -20 },
    { base: 90, high: 30, low: -20 },
    { base: 70, high: 20, low: -10 }
  ],

  "cafe": [
    { base: 50, high: 20, low: -20 },
    { base: 50, high: 20, low: -20 },
    { base: 60, high: 20, low: -10 },
    { base: 70, high: 20, low: -10 },
    { base: 80, high: 30, low: -10 },
    { base: 80, high: 20, low: -20 },
    { base: 90, high: 20, low: -10 },
    { base: 80, high: 30, low: -20 }
  ],

  "design_store": [
    { base: 50, high: 20, low: -20 },
    { base: 50, high: 20, low: -20 },
    { base: 60, high: 20, low: -10 },
    { base: 70, high: 20, low: -10 },
    { base: 100, high: 20, low: -10 },
    { base: 80, high: 20, low: -10 },
    { base: 90, high: 40, low: -10 },
    { base: 90, high: 30, low: -20 }
  ],

  "hair_salon": [
    { base: 50, high: 20, low: -20 },
    { base: 50, high: 20, low: -20 },
    { base: 60, high: 20, low: -10 },
    { base: 70, high: 20, low: -10 },
    { base: 100, high: 20, low: -10 },
    { base: 80, high: 20, low: -10 },
    { base: 90, high: 40, low: -10 },
    { base: 90, high: 30, low: -20 }
  ],

  "fashion_boutique": [
    { base: 50, high: 10, low: -30 },
    { base: 50, high: 10, low: -30 },
    { base: 60, high: 20, low: -10 },
    { base: 70, high: 20, low: -10 },
    { base: 90, high: 25, low: -10 },
    { base: 90, high: 30, low: -10 },
    { base: 100, high: 50, low: -10 },
    { base: 90, high: 30, low: -10 }
  ],

  "bar": [
    { base: 80, high: 20, low: -20 },
    { base: 80, high: 20, low: -20 },
    { base: 60, high: 20, low: -20 },
    { base: 70, high: 20, low: -20 },
    { base: 100, high: 20, low: -20 },
    { base: 90, high: 30, low: -20 },
    { base: 100, high: 50, low: -10 },
    { base: 100, high: 30, low: -10 }
  ],

  "event": [
    { base: 50, high: 20, low: -20 },
    { base: 50, high: 20, low: -20 },
    { base: 60, high: 20, low: -10 },
    { base: 70, high: 20, low: -10 },
    { base: 100, high: 20, low: -10 },
    { base: 80, high: 20, low: -10 },
    { base: 90, high: 40, low: -10 },
    { base: 90, high: 30, low: -20 }
  ],

  "fintess_studio": [
    { base: 90, high: 20, low: -20 },
    { base: 100, high: 30, low: -10 },
    { base: 110, high: 30, low: -10 },
    { base: 100, high: 30, low: -10 },
    { base: 100, high: 40, low: -10 },
    { base: 120, high: 20, low: -10 },
    { base: 120, high: 20, low: -10 },
    { base: 110, high: 20, low: -10 }
  ],

  "fintess_studio_max": [
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 },
    { base: 130, high: 10, low: -5 }
  ]

};


var MOOD_CHANGE = 5;

var MOOD_RANGE = {
  min: -3,
  max: 3
};

module.exports = {
  BPM_TABLE: BPM_TABLE,
  TIME_SLOTS: TIME_SLOTS,
  MOOD_RANGE: MOOD_RANGE,
  MOOD_CHANGE_STEP: MOOD_CHANGE
};
