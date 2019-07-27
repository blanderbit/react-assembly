'use strict';

const gulp = require('gulp');

const livereload = require('gulp-livereload');
const runSequence = require('run-sequence');

require('./gulp/admin');
require('./gulp/app');
require('./gulp/electron-app');
require('./gulp/landing');
require('./gulp/server');
require('./gulp/gzip');
// require('./gulp/brotli');

const isProd = process.env.NODE_ENV === 'production';

gulp.task('livereload', () => {
  livereload.listen(35301);
});

gulp.task('build', (cb) => {
  const sequence = [
    ['admin:build', 'play:build'],
    isProd ? 'gzip' : null,
    // isProd ? 'brotli' : null,
    'electron:build',
    cb
  ];
  runSequence(...sequence.filter((task) => task));
});

gulp.task('watch', (cb) => {
  runSequence(
    'build',
    'livereload',
    'watch:admin',
    'watch:play',
    'watch:electron',
    'watch:landing',
    cb
  );
});

gulp.task('default', ['server', 'watch']);
