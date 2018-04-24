'use strict';


var options = {
    src: './src/',
    dist: './dist/',
    resources: 'resources/'
};

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    minifyCss = require('gulp-minify-css'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    opn = require('opn'),
    connect = require('gulp-connect'),
    autoprefixer = require('autoprefixer-core');
    //ampify = require('ampify');

var processors = [
    autoprefixer({browsers: 'last 2 versions'})
];

/* SCSS */

gulp.task('sass', function () {

    gulp.src([
            options.src + '**/*.scss'
        ], { base: '.' })
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(minifyCss())
        .pipe(concat('style.css'))
        .pipe(gulp.dest(options.dist))
        .pipe(postcss(processors))
        .pipe(gulp.dest(options.dist));
});

gulp.task('resources', function () {

    gulp.src([
            options.resources + '**/*'
        ], { base: '.' })
        .pipe(gulp.dest(options.dist));
});

gulp.task('deploy', function () {

    gulp.src([
            options.dist + '**/*'
        ], { base: options.dist })
        .pipe(gulp.dest('../merge.place.web/'));
});

/* HTML */

gulp.task('html', function () {

    gulp.src([
            options.src + '**/*.html'
        ], { base: options.src })
        .pipe(gulp.dest(options.dist));
});

/* Javascript */

//gulp.task('libs', function () {
//    gulp.src([
//            'node_modules/jquery-countdown/dist/jquery.countdown.min.js'
//        ], { base: '.' })
//        .pipe(concat('libs.js'))
//        .pipe(gulp.dest('./export/'));
//});

gulp.task('scripts', function () {
    gulp.src([
            options.src + '**/*.js'
        ], { base: '.' })
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(options.dist));
});

/* Watcher */

gulp.task('watch', function () {
    gulp.watch([options.src + '**/*.scss'], ['sass']);
    gulp.watch([options.src + '**/*.html'], ['html']);
    gulp.watch([options.resources + '**/*'], ['resources']);
    gulp.watch([options.src + '**/*.js'], ['scripts']);
});

/* Default */

gulp.task('default', ['html','sass', 'scripts', 'resources']);