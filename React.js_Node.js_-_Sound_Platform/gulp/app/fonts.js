'use strict';

const gulp = require('gulp');

function copyFonts() {
  return gulp.src('./front/fonts/**/*')
    .pipe(gulp.dest('./generated/play/fonts'));
}

module.exports = copyFonts;
