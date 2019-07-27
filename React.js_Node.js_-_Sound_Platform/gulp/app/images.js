'use strict';

const gulp = require('gulp');

function copyImages() {
  return gulp.src('./front/images/**/*')
    .pipe(gulp.dest('./generated/play/images'));
}

module.exports = copyImages;
