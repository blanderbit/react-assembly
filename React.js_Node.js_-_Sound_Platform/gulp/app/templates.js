const gulp = require('gulp');
const templateCache = require('gulp-angular-templatecache');

module.exports = function buildTemplateCache() {
  return gulp
    .src([
      './front/js/templates/**/*.html',
      './front/js/components/**/*.html'
    ])
    .pipe(templateCache({
      standalone: true
    }))
    .pipe(gulp.dest('./generated/play/js'));
};
