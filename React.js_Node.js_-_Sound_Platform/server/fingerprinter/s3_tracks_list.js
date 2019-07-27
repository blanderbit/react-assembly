const AWS = require('aws-sdk');
const Promise = require('bluebird');
const logger = require('./logging').logger;
const _ = require('lodash');

if (!process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_MP3_BUCKET) {
  logger.error('You need to to set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, & AWS_MP3_BUCKET in process.env.');
  process.exit(1);
}

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

function listAllFiles(){
  const dfd = Promise.defer();
  const s3Client = new AWS.S3({ params: { Bucket: process.env.AWS_MP3_BUCKET } });

  let allFiles = [];

  const recurse = (marker) => {
    s3Client.listObjects({ Marker: marker }, function(err, data) {
      if (err) return dfd.reject(err);
      allFiles = allFiles.concat(data.Contents);
      if (data.IsTruncated) {
        recurse(_.last(allFiles).Key);
      } else {
        return dfd.resolve(allFiles);
      }
    });
  };

  recurse();

  return dfd.promise;
}

function filterAudioFiles(files) {
  return files.filter(function filterMp3(f) {
    return (f.Key.split('.').pop().toLowerCase() == 'mp3');
  });
}

const WHITELISTED_FOLDERS = [
  'mp3_berlin',
  'mp3_christmas',
  'mp3_fitnessmax',
  'mp3_miami',
  'mp3_neworleans',
  'mp3_oldies',
  'mp3_paris',
  'mp3all',
  'mp3_fitnessmax'
];

function filterWhitelistedFolders(files) {
  return files.filter((f) => _.includes(WHITELISTED_FOLDERS, f.Key.split('/')[0]));
}

function listBucketAudioFiles() {
  return listAllFiles()
    .then(filterAudioFiles)
    .then(filterWhitelistedFolders)
    .then((tracks) => _.map(tracks, 'Key'));
}

module.exports = listBucketAudioFiles;
