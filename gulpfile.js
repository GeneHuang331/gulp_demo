const gulp = require("gulp");
const del = require("del");
const autoprefixer = require("autoprefixer");
const gulpLoadPlugins = require("gulp-load-plugins");
const $ = gulpLoadPlugins();
const sass = require("gulp-sass")(require("sass"));
const browserSync = require("browser-sync").create();

const minimist = require("minimist");
const envOptions = {
  string: "env",
  default: {
    env: "develop",
  },
};
var options = minimist(process.argv.slice(2), envOptions);
// console.log(options)
var envIsPro = options.env === "production" || options.env === "pro";

//clean
function clean() {
  return del("./public");
}
exports.clean = clean;

//pug
function gulpPug() {
  return gulp
    .src("./source/**/*.pug")
    .pipe(
      $.pug({
        // Your options in here.
        pretty: true,
      })
    )
    .pipe(gulp.dest("./public"))
    .pipe(browserSync.stream());
}
exports.gulpPug = gulpPug;

//sass
function gulpSass() {
  const processors = [autoprefixer()];
  return gulp
    .src("./source/assets/scss/all.scss")
    .pipe($.sourcemaps.init())
    .pipe(
      $.if(
        envIsPro,
        sass({ 
          includePaths: ['./node_modules/bootstrap/scss'],
          outputStyle: "compressed",
         }).on("error", sass.logError)
      )
    )
    .pipe($.if(!envIsPro, sass(
      {
        includePaths: ['./node_modules/bootstrap/scss']
      }
    ).on("error", sass.logError)))
    .pipe($.postcss(processors))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest("./public/css"))
    .pipe(browserSync.stream());
}
exports.gulpSass = gulpSass;



//vendor.js
function vendorJS() {
  return gulp
    .src([
      "./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
    ])
    .pipe($.concat("vendor.js"))
    .pipe(gulp.dest("./public/javascripts"))
}
exports.vendorJS = vendorJS;

//vendor.css
// function vendorCSS() {
//   return gulp
//     .src([
//       "./node_modules/bootstrap/dist/css/bootstrap.min.css",
//     ])
//     .pipe($.concat("vendor.css"))
//     .pipe(gulp.dest("./public/css"))
// }
// exports.vendorCSS = vendorCSS;


//js
function gulpConcatJS() {
  return gulp
    .src("./source/assets/javascripts/**/*.js")
    .pipe($.sourcemaps.init())
    .pipe(
      $.babel({
        presets: ["@babel/env"],
      })
    )
    .pipe($.concat("all.js"))
    .pipe($.if(envIsPro, $.uglify()))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest("./public/javascripts"))
    .pipe(browserSync.stream());
}
exports.gulpConcatJS = gulpConcatJS;

//browser-sync
function browser() {
  browserSync.init({
    server: {
      baseDir: "./public",
    },
  });
}
exports.browser = browser;

//watch
function watch() {
  gulp.watch(["./source/**/*.pug"], gulpPug);
  gulp.watch(["./source/assets/scss/all.scss"], gulpSass);
  gulp.watch(["./source/assets/javascripts/**/*.js"], gulpConcatJS);
}
exports.watch = watch;

//deploy
function deploy() {
  return gulp.src('./public/**/*')
  .pipe($.ghPages());
}
exports.deploy = deploy;


//default
exports.default = gulp.series(
  clean,
  gulp.parallel(gulpPug, gulpSass, gulpConcatJS, vendorJS),
  function (done) {
    browserSync.init({
      server: {
        index:'index.html',
        baseDir: "./public",
      },
    });
    gulp.watch(["./source/**/*.pug"], gulpPug);
    gulp.watch(["./source/assets/scss/**/*.scss"], gulpSass);
    gulp.watch(["./source/assets/javascripts/**/*.js"], gulpConcatJS);
    done();
  }
);

