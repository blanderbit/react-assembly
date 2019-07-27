'use strict';

const escapeStringRegexp = require('escape-string-regexp');

module.exports = (trackTitle, userName) => {
  let escapedUsername = escapeStringRegexp(userName);

  // userName + something else + - + title
  const RE_USER = new RegExp(`^\s*(${escapedUsername}).*?\\s*-\\s*(.+)\\s*`, 'i');
  const userMatch = trackTitle.match(RE_USER);
  if (userMatch) {
    return {
      artistName: userMatch[1].trim(),
      title: userMatch[2].trim()
    };
  }

  if (trackTitle.indexOf('-') > 0) {
    return {
      artistName: trackTitle.split('-')[0].trim(),
      title: trackTitle.split('-').slice(1).join('-').trim()
    };
  }

  return {
    artistName: userName.trim(),
    title: trackTitle.trim()
  };
};
