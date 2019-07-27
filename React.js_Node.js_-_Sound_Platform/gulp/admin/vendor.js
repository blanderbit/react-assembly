const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');

const gulpIf = require('gulp-if');
const uglify = require('gulp-uglify');

const livereload = require('gulp-livereload');

const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'stage';

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');

const libs = require('./libs');

function buildScripts() {
  const bundler = browserify('./admin/js/libs.js', {
      debug: !isProd,
      detectGlobals: false
    })
    .require(libs);

  return bundler.bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('admin-vendor.js'))
    .pipe(buffer())
    .pipe(gulpIf(!isProd, sourcemaps.init({ loadMaps: true })))
    .pipe(gulpIf(isProd, uglify()))
    .pipe(gulpIf(!isProd, sourcemaps.write()))
    .pipe(gulp.dest('./generated/admin/js'))
    .pipe(livereload());
}

module.exports = buildScripts;
