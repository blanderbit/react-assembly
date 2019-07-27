'use strict';

const gulp = require('gulp');

function copyFonts() {
  return gulp.src('./admin/fonts/**/*')
    .pipe(gulp.dest('./generated/admin/fonts'));
}

module.exports = copyFonts;
