'use strict';

const gulp = require('gulp');
const less = require('gulp-less');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const mergeStream = require('merge-stream');

const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const livereload = require('gulp-livereload');

const autoprefixer = require('gulp-autoprefixer');

const RE_URL = /url\('(fonts\/icomoon\.(svg|ttf|woff|eot)\?\w+)(#\w+)?'\)/g;

const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'stage';

function buildStyles() {
  const icomoonStream = gulp.src('./front/icomoon/style.css')
    .pipe(replace(RE_URL, 'url(\'../fonts/icomoon.$2$3\')'));

  return mergeStream(icomoonStream, gulp.src('./front/less/site.less'))
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(concat('play.css'))
    .pipe(less({
      paths: ['./front/less']
    }))
    .pipe(autoprefixer({
      browsers: ['last 3 versions'],
      cascade: false
    }))
    .pipe(gulpIf(isProd, cleanCSS({ processImportFrom: ['local'] })))
    .pipe(gulpIf(!isProd, sourcemaps.write()))
    .pipe(gulp.dest('./generated/play/css'))
    .pipe(livereload());
}

module.exports = buildStyles;
