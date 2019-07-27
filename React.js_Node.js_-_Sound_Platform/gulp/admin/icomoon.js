'use strict';

const gulp = require('gulp');

function buildStyles() {
  return gulp.src(
    './admin/icomoon/fonts/icomoon.*'
  )
    .pipe(gulp.dest('./generated/admin/fonts'));
}

module.exports = buildStyles;
