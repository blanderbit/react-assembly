const gulp = require('gulp');
const nodemon = require('gulp-nodemon');

gulp.task('server', () => {
  nodemon({
    script: './server/index.js',
    watch: [
      './server'
    ],
    ext: 'js'
  });
});
