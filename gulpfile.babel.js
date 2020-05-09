import gulp from "gulp";
import yargs from "yargs";
import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import browserSync from "browser-sync";
import gulpif from "gulp-if";
import sourcemaps from "gulp-sourcemaps";
import cleanCSS from "gulp-clean-css";
import rename from "gulp-rename";
import concat from "gulp-concat";
import imagemin from "gulp-imagemin";
import babel from "gulp-babel";
import uglify from "gulp-uglify";
import clean from "gulp-clean";

const SERVER = browserSync.create();
const PRODUCTION = yargs.argv.prod;

const paths = {
  root: "./",
  dist: "./dist",
  html: {
    src: "./",
  },
  sass: {
    src: "src/scss/**/*.scss",
    dist: "dist/css",
  },
  css: {
    src: "src/css/**/*.css",
    dist: "dist/css",
  },
  js: {
    src: "src/js/*.js",
    dist: "dist/js",
  },
  images: {
    src: "src/img/**/*.+(png|jpg|gif|svg)",
    dist: "dist/img",
  },
  vendors: {
    src: "src/vendors/**/*.*",
    dist: "dist/vendors",
  },
};

/* ====== SCSS ======= */

export const scss = () => {
  return gulp
    .src(paths.sass.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(autoprefixer())
    .pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: "ie8" })))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulp.dest(paths.sass.dist))
    .pipe(SERVER.stream());
};

/* ====== CSS ======= */

export const css = () => {
  return gulp
    .src(paths.css.src)
    .pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: "ie8" })))
    .pipe(concat("app.css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(paths.css.dist));
};

/* ====== JS ======= */

export const js = () => {
  return gulp
    .src(paths.js.src)
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(gulpif(PRODUCTION, uglify()))
    .pipe(concat("app.js"))
    .pipe(gulp.dest(paths.js.dist))
    .pipe(SERVER.stream());
};

/* ====== IMAGE ======= */

export const images = () => {
  return gulp
    .src(paths.images.src)
    .pipe(
      gulpif(
        PRODUCTION,
        imagemin([
          imagemin.gifsicle({
            interlaced: true,
          }),
          imagemin.mozjpeg({
            quality: 75,
            progressive: true,
          }),
          imagemin.optipng({
            optimizationLevel: 5,
          }),
          imagemin.svgo({
            plugins: [
              {
                removeViewBox: true,
              },
              {
                cleanupIDs: false,
              },
            ],
          }),
        ])
      )
    )
    .pipe(gulp.dest(paths.images.dist));
};

/* ====== COPY VENDORS ======= */

export const vendors = () => {
  return gulp.src(paths.vendors.src).pipe(gulp.dest(paths.vendors.dist));
};

/* ====== CLEAN DIST FOLDER ======= */

export const cleanDist = () => {
  return gulp.src(paths.dist, { allowEmpty: true }).pipe(clean());
};

/* ====== SERVER ======= */

export const serve = (cb) => {
  SERVER.init({
    server: {
      baseDir: paths.root,
    },
  });
  cb();
};

export const reload = (done) => {
  SERVER.reload();
  done();
};

/* ====== WATCH FOR DEVELOPMENT ======= */

export const watch = () => {
  gulp.watch(paths.html.src, reload);
  gulp.watch(paths.sass.src, scss);
  gulp.watch(paths.js.src, gulp.series(js, reload));
  gulp.watch(paths.images.src, gulp.series(images, reload));
  gulp.watch(paths.vendors.src, gulp.series(vendors, reload));
};

export const dev = gulp.series(
  cleanDist,
  gulp.parallel(scss, js, images, vendors),
  serve,
  watch
);

export default dev;
