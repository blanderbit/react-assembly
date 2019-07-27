'use strict';

/**
 * Default query tuner - extends BPM range by 5 on each side
 * @param query - Mongo query to fine tune
 * @return query
 */
module.exports = function queryTuningFn(query) {
  var bpmKey = 'bpm';
  var clone = JSON.parse(JSON.stringify(query));
  if(!clone.$and) {
    throw new Error('Wrong query provided to refine');
  }
  var tempoQueryPart = clone.$and.filter(function tempo(cond) {
    return cond[bpmKey];
  });
  if(!tempoQueryPart.length) {
    throw new Error('No BPM related query condition defined');
  }
  var qp = tempoQueryPart[0];
  qp[bpmKey].$lte += 25;
  qp[bpmKey].$gte -= 25;
  return clone;
};
