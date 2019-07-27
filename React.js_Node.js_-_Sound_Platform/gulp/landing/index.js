'use strict';

const gulp = require('gulp');

const landing = {
  styles: require('./styles'),
  vendor: require('./vendor'),
  scripts: require('./scripts'),
  copyAssets: require('./copy-assets')
};

gulp.task('landing:scripts', landing.scripts);
gulp.task('landing:vendor', landing.vendor);
gulp.task('landing:styles', landing.styles);
gulp.task('landing:assets', landing.copyAssets);

gulp.task('landing:js', ['landing:scripts', 'landing:vendor']);

gulp.task('landing:build', [
  'landing:styles',
  'landing:js',
  'landing:assets'
]);

gulp.task('watch:landing:js', () => {
  gulp.watch('./landing/js/**/*.js', ['landing:js']);
});

gulp.task('watch:landing:css', () => {
  gulp.watch('./landing/css/*.scss', ['landing:styles']);
});

gulp.task('watch:landing', ['watch:landing:css', 'watch:landing:js']);
