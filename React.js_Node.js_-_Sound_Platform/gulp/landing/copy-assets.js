'use strict';

const gulp = require('gulp');

function copyAssets() {
  return gulp.src(['./landing/font/**/*.*', './landing/img/**/*.*'], { base: './landing' })
    .pipe(gulp.dest('./generated/landing'));
}

module.exports = copyAssets;
