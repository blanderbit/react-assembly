'use strict';

const gulp = require('gulp');

function copyImages() {
  return gulp.src('./admin/images/**/*')
    .pipe(gulp.dest('./generated/admin/images'));
}

module.exports = copyImages;
