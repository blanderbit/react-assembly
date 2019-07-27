'use strict';

const gulp = require('gulp');
const brotli = require('gulp-brotli');

gulp.task('brotli', () => {
  return gulp.src('./generated/**/!(*.gz|*.br|*.jpg|*.png|*.woff|*.eot)')
    .pipe(brotli.compress({
      skipLarger: true,
      mode: 0,
      quality: 11,
      lgblock: 0
    }))
    .pipe(gulp.dest('./generated'));
});
