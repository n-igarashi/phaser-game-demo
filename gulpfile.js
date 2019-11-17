const autoprefixer = require('autoprefixer');
const bs = require('browser-sync').create();
const del = require('del');
const deleteEmpty = require('delete-empty');
const gulp = require('gulp');
const cached = require('gulp-cached');
const cleanCSS = require('gulp-clean-css');
const fileInclude = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const pug = require('gulp-pug');
const revAll = require('gulp-rev-all');
const revDel = require('gulp-rev-delete-original');
const revReplace = require('gulp-rev-replace');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const stylus = require('gulp-stylus');
const watch = require('gulp-watch');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const packageImporter = require('node-sass-package-importer');
const path = require('path');
const pixrem = require('pixrem');
const reporter = require('postcss-reporter');
const runSequence = require('run-sequence');
const stylelint = require('stylelint');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const dir = {
  src: './src',
  dist: './dist'
};

const DEBUG = !process.argv.includes('build');

const cssProcessors = [
  pixrem({
    atrules: true
  }),
  autoprefixer({
    browsers: [
      'last 2 versions',
      'Android > 4.4'
    ],
    cascade: false
  })
];

const cleanLevel = {
  dev: 0,
  prod: {
    2: {
      mergeMedia: false,
      overrideProperties: false
    }
  }
};

const cleanConf = {
  format: DEBUG ? 'beautify' : false,
  level: DEBUG ? cleanLevel.dev : cleanLevel.prod
};

/**
 * Build Subtasks
 */
gulp.task('browser-sync', () => {
  return bs.init({
    notify: false,
    server: {
      baseDir: dir.dist
    }
  });
});

gulp.task('clean:dist', callback => {
  return del([
    dir.dist + '/**/*.*',
    '!' + dir.dist + '/_assets/css/**/*.*',
    '!' + dir.dist + '/_assets/js/**/*.*',
    '!' + dir.dist + '/_assets/images/**/*.*',
    '!' + dir.dist + '/**/*.html'
  ], callback);
});

gulp.task('clean:styles', callback => {
  return del([
    dir.dist + '/_assets/css/**/*.*',
    dir.dist + '/_assets/sourcemaps/**/*.css.map'
  ], callback);
});

gulp.task('clean:scripts', callback => {
  return del([
    dir.dist + '/_assets/js/**/*.*',
    dir.dist + '/_assets/sourcemaps/**/*.js.map'
  ], callback);
});

gulp.task('clean:images', callback => {
  return del([dir.dist + '/_assets/images/**/*.*'], callback);
});

gulp.task('clean:html', callback => {
  return del([dir.dist + '/**/*.html'], callback);
});

gulp.task('delete-empty', () => {
  return deleteEmpty.sync(dir.dist);
});

gulp.task('copy:src', ['delete-empty'], () => {
  return gulp.src([
    dir.src + '/**/*.*',
    '!' + dir.src + '/_assets/scss/**/*.scss',
    '!' + dir.src + '/_assets/styl/**/*.styl',
    '!' + dir.src + '/_assets/js/**/*.js',
    '!' + dir.src + '/_assets/images/**/*.*',
    '!' + dir.src + '/**/*.pug',
    '!' + dir.src + '/**/*.html'
  ], {nodir: true})
    .pipe(gulp.dest(dir.dist))
    .pipe(bs.stream());
});

gulp.task('copy', callback => {
  runSequence('clean:dist', 'copy:src', callback);
});

gulp.task('stylelint', () => {
  return gulp.src([dir.src + '/_assets/scss/**/*.scss'])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(postcss([
      stylelint({fix: true}),
      reporter()
    ], {syntax: require('postcss-scss')}))
    .pipe(cached('stylelint'))
    .pipe(gulp.dest(dir.src + '/_assets/scss'));
});

gulp.task('styles', ['clean:styles', 'stylelint'], () => {
  return gulp.src([dir.src + '/_assets/scss/**/*.scss'])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(sourcemaps.init())
    .pipe(sass({
      importer: packageImporter({
        extensions: ['.scss', '.css']
      })
    }))
    .pipe(postcss(cssProcessors))
    .pipe(cleanCSS(cleanConf))
    .pipe(sourcemaps.write('../sourcemaps', {addComment: DEBUG}))
    .pipe(gulp.dest(dir.dist + '/_assets/css'))
    .pipe(bs.stream());
});

gulp.task('stylus', ['clean:styles'], () => {
  return gulp.src([dir.src + '/_assets/styl/**/[^_]*.styl'], {nodir: true})
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(sourcemaps.init())
    .pipe(stylus({
      include: ['./node_modules'],
      'include css': true
    }))
    .pipe(postcss(cssProcessors))
    .pipe(cleanCSS(cleanConf))
    .pipe(sourcemaps.write('../sourcemaps', {addComment: DEBUG}))
    .pipe(gulp.dest(dir.dist + '/_assets/css'))
    .pipe(bs.stream());
});

gulp.task('scripts', () => {
  return gulp.src([dir.src + '/_assets/js/index.js'])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(webpackStream(require('./webpack.config'), webpack))
    .on('error', function handleError() {
      this.emit('end');
    })
    .pipe(gulp.dest(dir.dist + '/_assets/js'))
    .pipe(bs.stream());
});

gulp.task('imagemin', () => {
  return gulp.src([dir.src + '/_assets/images/**/*.*'])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(cached('imagemin'))
    .pipe(imagemin([
      pngquant({
        quality: '65-80',
        speed: 1
      }),
      mozjpeg({quality: 80}),
      imagemin.svgo(),
      imagemin.gifsicle()
    ]))
    .pipe(imagemin())
    .pipe(gulp.dest(dir.dist + '/_assets/images'))
    .pipe(bs.stream());
});

gulp.task('pug', ['clean:html'], () => {
  return gulp.src([
    dir.src + '/**/[^_]*.pug',
    dir.src + '/**/_tpl_*.pug'
  ])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(pug({pretty: true}))
    .pipe(gulp.dest(dir.dist))
    .pipe(bs.stream());
});

gulp.task('html:file-include', ['delete-empty'], () => {
  return gulp.src([
    dir.src + '/**/[^_]*.html',
    dir.src + '/**/_tpl_*.html'
  ])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(fileInclude())
    .pipe(gulp.dest(dir.dist))
    .pipe(bs.stream());
});

gulp.task('html', callback => {
  runSequence('clean:html', 'html:file-include', callback);
});

gulp.task('htmlmin', () => {
  return gulp.src([dir.dist + '/**/[^_tpl_]*.html'])
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest(dir.dist));
});

gulp.task('rev', () => {
  return gulp.src([dir.dist + '/_assets/**/*.+(css|js)'])
    .pipe(revAll.revision({
      transformFilename: (file, hash) => {
        const ext = path.extname(file.path);
        return path.basename(file.path, ext) + '-' + hash.substr(0, 20) + ext;
      }
    }))
    .pipe(revDel())
    .pipe(gulp.dest(dir.dist + '/_assets'))
    .pipe(revAll.manifestFile())
    .pipe(gulp.dest(dir.dist + '/_assets'));
});

gulp.task('revreplace', ['rev'], () => {
  const manifest = gulp.src([dir.dist + '/_assets/rev-manifest.json']);
  return gulp.src([dir.dist + '/**/*.html'])
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest(dir.dist));
});

gulp.task('revision', ['revreplace']);

gulp.task('watch:styles', () => {
  return watch([dir.src + '/_assets/scss/**/*.scss'], () => {
    return gulp.start(['styles']);
  });
});

gulp.task('watch:stylus', () => {
  return watch([dir.src + '/_assets/styl/**/*.styl'], () => {
    return gulp.start(['stylus']);
  });
});

gulp.task('watch:scripts', () => {
  return watch([dir.src + '/_assets/js/**/*.js'], () => {
    return gulp.start(['scripts']);
  });
});

gulp.task('watch:images', () => {
  return watch([dir.src + '/_assets/images/**/*.*'], () => {
    return gulp.start(['imagemin']);
  });
});

gulp.task('watch:pug', () => {
  return watch([dir.src + '/**/*.pug'], () => {
    return gulp.start(['pug']);
  });
});

gulp.task('watch:html', () => {
  return watch([dir.src + '/**/*.html'], () => {
    return gulp.start(['html']);
  });
});

gulp.task('watch:src', () => {
  return watch([
    dir.src + '/**/*.*',
    '!' + dir.src + '/_assets/scss/**/*.scss',
    '!' + dir.src + '/_assets/styl/**/*.styl',
    '!' + dir.src + '/_assets/js/**/*.js',
    '!' + dir.src + '/_assets/images/**/*.*',
    '!' + dir.src + '/**/*.pug',
    '!' + dir.src + '/**/*.html'
  ], () => {
    return gulp.start(['copy']);
  });
});

gulp.task('watch', ['watch:styles', 'watch:scripts', 'watch:images', 'watch:pug', 'watch:src']);

/**
 * Build Tasks
 */
gulp.task('default', callback => {
  runSequence(['clean:images', 'clean:scripts', 'copy'], ['styles', 'scripts', 'imagemin', 'pug'], 'browser-sync', 'watch', callback);
});

gulp.task('build', callback => {
  runSequence(['clean:images', 'clean:scripts', 'copy'], ['styles', 'scripts', 'imagemin', 'pug'], ['htmlmin', 'revision'], callback);
});
