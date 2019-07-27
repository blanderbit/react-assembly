'use strict';

const gulp = require('gulp');

gulp.task('electron:build', () => {
  // just copy original app's files
  return gulp.src('./generated/play/**/*')
    .pipe(gulp.dest('./generated/electron-app'));
});

gulp.task('watch:electron', () => {
  gulp.watch(['./generated/play/**/*'], ['electron:build']);
});
