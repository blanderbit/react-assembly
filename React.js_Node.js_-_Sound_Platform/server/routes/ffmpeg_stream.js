const { spawn } = require('child_process');

const args = [
  '-re',
  '-i',
  'pipe:0',
  '-map_metadata',
  '-1',
  '-acodec',
  'copy',
  '-f',
  'mp3',
  '-f',
  'mulaw',
  '-'
];

module.exports = function ffmpegStrem() {
  return spawn('ffmpeg', args);
};
