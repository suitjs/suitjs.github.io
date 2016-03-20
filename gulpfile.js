var gulp    = require("gulp");
var del     = require("del");
var sass    = require("gulp-sass");
var rename  = require("gulp-rename");

var isDebug = false;

console.log("gulp> Init.");

/**
 * Main Paths
 */
var path = {
    src: "source/",
    dst: "deploy/"    
};

//Path to js files
path.js   = { src: path.src+"js/", dst: path.dst+"js/" };

//Path to scss files
path.scss = { src: path.src+"scss/", dst: path.dst+"css/" };

//Source Stream for JS
var jsFiles = gulp.src(path.js.src+"**/*.js");

//Destination Stream for JS
var jsDst   = gulp.dest(path.js.dst);

//Source stream for Sass
var scssFiles = gulp.src(path.scss.src+"**/*.scss");

//Destination stream for Sass
var scssDst   = gulp.dest(path.scss.dst);


//Move Javascript files to the deploy folder.
gulp.task("move-js", function moveJS() {    
    return jsFiles.pipe(jsDst);
});

//Build Sass files to CSS deploy folder.
gulp.task("build-scss",function buildScss() {    
    
    scssFiles
    .pipe(sass.sync().on("error", sass.logError))
    .pipe(scssDst);
    
    scssFiles
    .pipe(sass.sync({outputStyle: "compressed"}).on("error", sass.logError))
    .pipe(rename({suffix: ".min"}))
    .pipe(scssDst);
            
});


//Builds the website.
gulp.task("build",["move-js","build-scss"],function build() {
    
    
});

