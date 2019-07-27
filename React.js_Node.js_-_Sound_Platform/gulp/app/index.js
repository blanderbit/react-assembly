'use strict';

const gulp = require('gulp');

const play = {
  scripts: require('./scripts'),
  vendor: require('./vendor'),
  templates: require('./templates'),
  styles: require('./styles'),
  icomoon: require('./icomoon'),
  images: require('./images'),
  fonts: require('./fonts')
};

gulp.task('play:scripts', ['play:templates'], play.scripts);
gulp.task('play:vendor', play.vendor);
gulp.task('play:templates', play.templates);

gulp.task('play:styles', play.styles);
gulp.task('play:icomoon', play.icomoon);
gulp.task('play:images', play.images);
gulp.task('play:fonts', play.fonts);

gulp.task('play:js', ['play:scripts', 'play:vendor']);

gulp.task('play:build', [
  'play:js',
  'play:styles',
  'play:icomoon',
  'play:images',
  'play:fonts'
]);

gulp.task('watch:play:js', () => {
  gulp.watch(['./front/js/**/*.js', './generated/play/js/templates.js'], ['play:scripts']);
});

gulp.task('watch:play:css', () => {
  gulp.watch('./front/**/*.less', ['play:styles']);
});

gulp.task('watch:play:templates', () => {
  gulp.watch('./front/js/components/**/*.html', ['play:templates']);
});

gulp.task('watch:play', ['watch:play:js', 'watch:play:css', 'watch:play:templates']);
