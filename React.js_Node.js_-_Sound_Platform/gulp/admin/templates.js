const gulp = require('gulp');
const templateCache = require('gulp-angular-templatecache');

module.exports = function buildTemplateCache() {
  return gulp.src(['./admin/templates/**/*.tpl.html', './admin/js/**/*.html'])
    .pipe(templateCache({
      standalone: true
    }))
    .pipe(gulp.dest('./admin/templates'));
};
