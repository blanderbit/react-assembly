'use strict';

const gulp = require('gulp');

const admin = {
  scripts: require('./scripts'),
  vendor: require('./vendor'),
  templates: require('./templates'),
  styles: require('./styles'),
  icomoon: require('./icomoon'),
  images: require('./images'),
  fonts: require('./fonts')
};

gulp.task('admin:scripts', ['admin:templates'], admin.scripts);
gulp.task('admin:vendor', admin.vendor);
gulp.task('admin:templates', admin.templates);

gulp.task('admin:styles', admin.styles);
gulp.task('admin:icomoon', admin.icomoon);
gulp.task('admin:images', admin.images);
gulp.task('admin:fonts', admin.fonts);

gulp.task('admin:js', ['admin:scripts', 'admin:vendor']);

gulp.task('admin:build', [
  'admin:js',
  'admin:styles',
  'admin:icomoon',
  'admin:images',
  'admin:fonts'
]);

gulp.task('watch:admin:js', () => {
  gulp.watch(['./admin/js/**/*.js', './admin/templates/templates.js'], ['admin:scripts']);
});

gulp.task('watch:admin:css', () => {
  gulp.watch('./admin/less/**/*.less', ['admin:styles']);
});

gulp.task('watch:admin:templates', () => {
  gulp.watch('./admin/**/**.html', ['admin:templates']);
});

gulp.task('watch:admin', ['watch:admin:js', 'watch:admin:css', 'watch:admin:templates']);
