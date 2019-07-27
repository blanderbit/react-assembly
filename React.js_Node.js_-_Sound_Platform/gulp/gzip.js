'use strict';

const gulp = require('gulp');
const gzip = require('gulp-gzip');

gulp.task('gzip', () => {
  return gulp.src('./generated/**/!(*.gz|*.br|*.jpg|*.png|*.woff|*.eot)')
    .pipe(gzip({
      threshold: 8 * 1024,
      gzipOptions: { level: 9 },
      deleteMode: './generated'
    }))
    .pipe(gulp.dest('./generated'));
});
