const request = require('request');
const _ = require('lodash');
const async = require('async');
const express = require('express');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const router = new express.Router();

const requestOpts = {};

const requestInstance = request.defaults(requestOpts);
const logger = require('../logger').main;
const getFfmpegChildProcess = require('./ffmpeg_stream');

const s3 = new AWS.S3({
  signatureVersion: 'v4',
  region: 'eu-central-1',
  params: { Bucket: 'sonnenbank-test' }
});

const DEFAULT_COUNTERS = {
  128: 1,
  160: 1,
  192: 1
};

const counters = Object.assign({}, DEFAULT_COUNTERS);

const NUM_SONGS = 7;

const incrementCounter = (br) => {
  counters[br] = (counters[br] + 1) > NUM_SONGS ? 1 : counters[br] + 1;
};

const getNextTrackUrl = (bitrate) => Promise.resolve(s3.getSignedUrl('getObject', {
  Key: `${bitrate}/${counters[bitrate]}.mp3`,
  Expires: 24 * 3600
}));

const getStationStream = (req, res) => {
  const reqId = uuidv4();
  const logPrefix = `Sonnenbank ${reqId}:`;

  req.setTimeout(10 * 60 * 1000);
  const bitrate = parseInt(req.params.bitrate, 10);

  let requestHasBeenClosed = false;

  const cancelPlaying = () => { requestHasBeenClosed = true; };
  const hasActiveClient = () => !requestHasBeenClosed;

  req
    .on('close', cancelPlaying)
    .on('end', cancelPlaying);

  res.append('Content-Type', 'audio/mpeg');

  const playContinuously = (cb) => {
    const playTrack = (trackUrl, _cb) => {
      logger.info(`${logPrefix} starting ${trackUrl}`);
      const cb = _.once(_cb);

      let totalSent;
      let readStream;
      let firstChunkServed;

      try {
        readStream = requestInstance(trackUrl);
      } catch (err) {
        logger.error(`${logPrefix} failed to get data from AWS: `, err);
        cb(err);
        return;
      }

      readStream.on('end', () => {
        logger.info(`${logPrefix} finished reading response`);
      });

      const ffmpegChildProcess = getFfmpegChildProcess();

      ffmpegChildProcess.on('error', (err) => {
        logger.error(`${logPrefix} failed to start ffmpeg: `, err);
        readStream.abort();
      });

      readStream
        .on('response', (response) => {
          const totalTrackSize = parseInt(response.headers['content-length'], 10) / 1024;

          logger.info(`${logPrefix} got data response: ${totalTrackSize}KB`);

          readStream.pipe(ffmpegChildProcess.stdin);

          // ffmpegChildProcess.stderr
          //   .on('data', (chunk) => {
          //     logger.info(`${logPrefix} ffmpeg: ${chunk.toString()}`);
          //   });

          ffmpegChildProcess.stdout
            .on('data', (chunk) => {
              totalSent += Buffer.byteLength(chunk);

              if (!firstChunkServed) {
                firstChunkServed = Date.now();
                incrementCounter(bitrate);
              }

              if (hasActiveClient()) {
                res.write(chunk);
              }
            });

          ffmpegChildProcess
            .on('close', () => {
              logger.info(`${logPrefix} ffmpeg has closed`);
              cb(null);
            })
            .on('exit', () => {
              logger.info(`${logPrefix} ffmpeg has exited`);
              cb(null);
            });
        })
        .on('error', (err) => {
          logger.error(`${logPrefix} request emitted error: `, err);
          ffmpegChildProcess.kill('SIGHUP');
          cb(err);
        });
    };

    getNextTrackUrl(bitrate)
      .then((trackUrl) => playTrack(trackUrl, cb))
      .catch(cb);
  };

  async.whilst(
    hasActiveClient,
    playContinuously,
    (err) => {
      if (err) {
        logger.error(`${logPrefix} error:`, err);
        req.socket.destroy();
      }

      logger.info(`${logPrefix} client has gone`);
    }
  );
};

function resetCounters(req, res) {
  Object.assign(counters, DEFAULT_COUNTERS);
  res.send('Counters were reset successfully');
}

router.get('/:bitrate(128|160|192)', getStationStream);
router.get('/reset', resetCounters);
router.get('/counters', (req, res) => {
  res.send(counters);
});

module.exports = router;
