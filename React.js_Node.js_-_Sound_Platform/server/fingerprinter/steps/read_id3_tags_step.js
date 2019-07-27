var Promise = require('bluebird');
var AWS = require('aws-sdk');
var mm = require('musicmetadata');
var extend = require('util')._extend;

var genericStep = require('./generic_step');
var models = require('../../models');
var Song = models.Song;


module.exports.buildWith = function() {

  var s3 = new AWS.S3();

  var step = {
    name: 'Read ID3 tags data step',
    runWhen: 'initialized',
    updateTo: 'id3TagsScanned',
    run: function (trackInfo, trackRecord) {
      return Promise.resolve()
        .then(function () {
          return extractId3Tags(s3, trackRecord.file)
        })
        .then(function (tags) {
          return uploadCoverImage(s3, tags);
        })
        .then(function (tags) {
          return applyId3Tags(trackRecord, tags);
        })
        .catch(function (err) {
          console.error('Could not read ID3 tags', err.message);
          return trackRecord;
        });
    }
  };

  genericStep.mixin.call(step);
  return step;
};

function extractId3Tags(s3, filename) {
  var dfd = Promise.defer();
  var s3Request = s3.getObject({Bucket: process.env.AWS_MP3_BUCKET, Key: filename});
  var parser = mm(s3Request.createReadStream());
  var tags = {};

  parser.on('TBPM', function (bpm) {
    extend(tags, { bpm: bpm });
  });
  parser.on('metadata', function (metadata) {
    extend(tags, metadata);
  });

  parser.on('done', function (err) {
    // s3Request.abort();
    if(err) return dfd.reject(new Error('Could not read ID3 tags from ' + filename));
    dfd.resolve(tags);
  });
  return dfd.promise;
}

function uploadCoverImage(s3, tags) {
  var picture = tags.picture.pop();
  if(!picture) return tags;
  return uploadPicture(s3, picture, tags).then(function (coverArtUrl) {
    tags.coverImageUploaded = coverArtUrl;
    return tags;
  })
}

function uploadPicture(s3, pictureData, allTags) {
  var pictureS3Key = joinIfArray(allTags.artist) + ' - ' + allTags.title + '.' + pictureData.format;
  var s3Params = {
    Bucket: process.env.AWS_ARTWORK_BUCKET,
    Key: pictureS3Key,
    ACL: 'public-read',
    Body: pictureData.data
  };
  return doUpload(s3, s3Params).then(function () {
    return 'https://' + process.env.AWS_ARTWORK_BUCKET + '.s3.amazonaws.com/' + pictureS3Key;
  });
}

function doUpload(s3, s3Params) {
  var dfd = Promise.defer();
  console.log('Uploading cover image', s3Params.Key);
  s3.putObject(s3Params, function(err, result) {
    if(err) return dfd.reject(err);
    return dfd.resolve(result);
  });
  return dfd.promise;
}

function applyId3Tags(record, tags) {
  // if(!enoughID3TagsDefined(tags)) {
  //   console.warn('Not applying ID3 tags - they seem to be not well defined');
  //   return record;
  // }
  record.id3 = {
    available: true,
    bpm: tags.bpm || undefined,
    artist: joinIfArray(tags.artist) || undefined,
    title: tags.title || undefined,
    album: tags.album || undefined,
    genres: tags.genre || [],
    year: tags.year || undefined,
    coverImage: tags.coverImageUploaded || undefined
  };
  return record;
}

function enoughID3TagsDefined(tags) {
  return tags.bpm && tags.artist && tags.title && tags.year;
}

function joinIfArray(value) {
  if(Array.isArray(value)) {
    return value.join(' & ');
  }
  return value;
}
