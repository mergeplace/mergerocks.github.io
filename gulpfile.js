'use strict';

const { series, src, dest, watch, parallel, task } = require('gulp');
const browserSync = require('browser-sync').create();
const using = require('gulp-using');
const htmlmin = require('gulp-htmlmin');
const del = require('del');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require("gulp-imagemin");
const cssnano = require("cssnano");
const autoprefixer = require('autoprefixer');
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const babel = require('gulp-babel');
const webpack = require('webpack-stream');
const named = require('vinyl-named');
const uglify = require('gulp-uglify');

const path = {
  src: 'src',
  build: 'dist',
  root: './',
  maps: './maps',
}
const input = {
  scss: `${path.src}/scss/**/*.scss`,
  html: `${path.src}/**/*.html`,
  js: `${path.src}/js/index.js`,
  images: `${path.src}/images/**/*`,
  fonts: `${path.src}/fonts/**/*`,
}
const output = {
  css: `${path.build}/css`,
  js: `${path.build}/js/`,
  images: `${path.build}/images`,
  fonts: `${path.build}/fonts`,
}

// Doesn't break the watcher, just shows an error in console.
const onErrorHandler = (error) => {
  console.log(error);
  this.emit('end');
};

// Server
const myPort = 4000;

task('serve:start', (done) => {
  browserSync.init({
    server: {
      baseDir: path.build,
    },
    port: myPort,
    notify: false,
    open: true,
  });
  watch(input.scss, task('compile:style'));
  watch(input.html, task('compile')).on('change', browserSync.reload);
  watch(input.js, task('compile:js')).on('change', browserSync.reload);
  done();
});

// Clean
const CLEAN_BUILD = function CLEAN_BUILD(cb) {
  del.sync(path.build);
  cb();
};
task('clean', series(CLEAN_BUILD));

// Compile HTML
task('compile:html', () => {
  return src(input.html)
  .pipe(dest(path.build));
});

// Compile Style
task('compile:style', () => { 
  const plugins = [
    autoprefixer({browsers: ['last 1 version']}),
  ];
  return src(input.scss)
    .pipe(plumber())
    .pipe(using({ prefix: 'After changed:', path:'relative', color:'magenta', filesize:true}))
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write(path.root))
    .pipe(dest(output.css))
    .pipe(browserSync.stream());
});

// Build Style
task('build:style', () => { 
  const plugins = [
    autoprefixer({browsers: ['last 1 version']}),
    cssnano(),
  ];
  return src(input.scss)
    .pipe(using({ prefix: 'After changed:', path:'relative', color:'magenta', filesize:true}))
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(dest(output.css))
});

// Compile Images
task('compile:images', () => {
  return src(input.images)
    .pipe(newer(output.images))
    .pipe(dest(output.images));
})

// Build Images
task('build:images', () => {
  return src(input.images)
    .pipe(newer(output.images))
    .pipe(using({ prefix: 'After changed:', path:'relative', color:'cyan', filesize:true}))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [ 
            { removeUselessDefs: false },
            { cleanupIDs: false} 
          ]
        }),
      ])
    )
    .pipe(dest(output.images));
})

// Compile Fonts
task('compile:fonts', () => {
  return src(input.fonts)
    .pipe(newer(output.fonts))
    .pipe(dest(output.fonts));
});

// Build Fonts
task('build:fonts', () => {
  return src(input.fonts)
    .pipe(dest(output.fonts));
})

// Compile JS
task('compile:js', () => {
  return src(input.js)
    .pipe(plumber({ errorHandler: onErrorHandler }))
    .pipe(using({ prefix: 'After changed:', path:'relative', color:'yellow', filesize:true}))
    .pipe(named())
    .pipe(webpack({
      mode: 'development',
    }))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(rename({ basename: "app" }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(output.js))
    .pipe(plumber.stop())
    .pipe(browserSync.stream());
});

// Compile JS
task('build:js', () => {
  return src(input.js)
    .pipe(using({ prefix: 'After changed:', path:'relative', color:'yellow', filesize:true}))
    .pipe(named())
    .pipe(webpack({
      mode: 'production',
    }))
    .pipe(babel({
        presets: ['@babel/env'],
    }))
    .pipe(uglify())
    .pipe(rename({ basename: "app" }))
    .pipe(dest(output.js))
    .pipe(browserSync.stream());
});

// => Compile All
task('compile', parallel('compile:html', 'compile:fonts', 'compile:images', 'compile:style', 'compile:js'))

// Compile All => Start Server
task('serve', series('compile', 'serve:start'));

['serve'].description = `serve compiled source on local server at port ${myPort}`;
['watch'].description = 'watch for changes to all source';

task('build', series('clean', parallel('compile:html', 'build:fonts', 'build:js', 'build:style', 'compile:images')));

task('default', series('clean', 'serve'));
