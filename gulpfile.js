var gulp = require('gulp'),
  del = require('del'),
  size = require('gulp-size'),
  jshint = require('gulp-jshint'),
  htmlmin = require('gulp-htmlmin'),
  moreCSS = require('gulp-more-css'),
  imagemin = require('gulp-imagemin'),
  imageOptim = require('gulp-imageoptim');

const mongoose = require('mongoose'),
  fs = require('fs'),
  Poll = require(__dirname + '/app/models/poll'),
  uristring = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/polls';

gulp.task('insert', () => {
  mongoose.connect(uristring, err => {
    const folder = process.argv[process.argv.indexOf('--folder') + 1];
    const insertJson = (err, data) => {
      if (err) throw err;
      const deleteFile = (err, data) => {
        if (err) throw err;
        console.log('File inserted in MongoDB: ', data);
      };
      (new Poll(JSON.parse(data))).save(deleteFile);
      gulp.src('uploads/' + folder + '/*.{gif,jpg,jpeg,svg,png}')
        .pipe(imagemin(
          [imagemin.svgo({plugins: [{removeViewBox: true}]})],
          {verbose: true}
        ))
        .pipe(size())
        .pipe(gulp.dest('src/uploads/' + folder))
        .on('end', () => del.sync(['uploads/' + folder]));
    };
    fs.readFile(`${__dirname}/uploads/${folder}/poll.json`, 'utf8', insertJson);
  });
});

gulp.task('clean', () =>
  del.sync(['./dist/**'])
);
gulp.task('html', () => 
  gulp.src(['src/html/*.html', 'src/index.html'], {base: './src'})
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(size())
    .pipe(gulp.dest('dist'))
);
gulp.task('css', () =>
  gulp.src('./src/css/index.css')
    .pipe(moreCSS())
    .pipe(size())
    .pipe(gulp.dest('./dist/css'))
);
gulp.task('images', () =>
  gulp.src(['src/images/**/*', 'src/favicon.ico'], {base: './src'})
    .pipe(imageOptim.optimize())
    .pipe(size())
    .pipe(gulp.dest('dist/'))
);
gulp.task('movejs', () =>
  gulp.src(
      ['src/js/**/*', 'src/*.js', 'src/*.json'],
      {base: './src'}
    )
    .pipe(size())
    .pipe(gulp.dest('dist/'))
);
gulp.task('lint', () =>
  gulp.src(['./src/js/**/*', '!./src/js/vendors/**/*'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
);
gulp.task('submit', ['insert']);
gulp.task('build', ['clean', 'html', 'movejs', 'css', 'images']) // build for production