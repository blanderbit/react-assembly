'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const livereload = require('gulp-livereload');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');

const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'stage';

module.exports = function buildStyles() {
  return gulp.src('./landing/css/landing.scss')
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 3 versions'],
      cascade: false
    }))
    .pipe(gulpIf(!isProd, sourcemaps.write()))
    .pipe(gulp.dest('./generated/landing/css'))
    .pipe(livereload());
};
