'use strict';

const gulp = require('gulp');

function buildStyles() {
  return gulp.src(
    './front/icomoon/fonts/icomoon.*'
  )
    .pipe(gulp.dest('./generated/play/fonts'));
}

module.exports = buildStyles;
