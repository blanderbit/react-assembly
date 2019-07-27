'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');

const ngAnnotate = require('gulp-ng-annotate');

const gulpIf = require('gulp-if');
const uglify = require('gulp-uglify');

const livereload = require('gulp-livereload');

const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'stage';

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const babel = require('babelify');

module.exports = (entries, external, dstFilename, dst, req) => (
  function buildScripts() {
    const bundler = browserify(entries, {
      debug: !isProd,
      detectGlobals: false
    })
    .require(req || [])
    .external(external)
    .transform(babel.configure({
      presets: ['es2015'],
      plugins: [
        'transform-runtime',
        'transform-object-assign',
        'transform-async-to-generator'
      ]
    }));

    return bundler.bundle()
      // TODO: error handling
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source(dstFilename))
      .pipe(buffer())
      .pipe(ngAnnotate())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(gulpIf(isProd, uglify()))
      .pipe(gulpIf(!isProd, sourcemaps.write()))
      .pipe(gulp.dest(dst))
      .pipe(livereload());
  }
);
