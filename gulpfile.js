var gulp     = require("gulp");
var del      = require("del");
var sass     = require("gulp-sass");
var rename   = require("gulp-rename");
var template = require("gulp-template");

var isDebug = false;

console.log("gulp> Init.");

//Main Paths
var path = {
    src: "./source",
    dst: "./deploy"    
};

//File Paths
path.js   = { src: path.src+"/js",   dst: path.dst+"/js" };
path.scss = { src: path.src+"/scss", dst: path.dst+"/css" };
path.html = { src: path.src+"/html", dst: path.dst };

//Source Streams
var jsFiles   = gulp.src(path.js.src  +"/**/*.js");
var scssFiles = gulp.src(path.scss.src+"/**/*.scss");
var htmlFiles = gulp.src(path.html.src+"/**/*.html");

//Destination Streams
var jsDst   = gulp.dest(path.js.dst);
var scssDst = gulp.dest(path.scss.dst);
var htmlDst = gulp.dest(path.html.dst);

//Delete the contents of deploy folder
gulp.task("clean",function clean(){
    return del(path.dst);
})

//Move Javascript files to the deploy folder.
gulp.task("move-js", function moveJS() {    
    return jsFiles.pipe(jsDst);
});

//Move HTML files to the deploy folder.
gulp.task("move-html", function moveHTML() {    
    return htmlFiles.pipe(htmlDst);
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

//Build Template files to HTML deploy folder.
gulp.task("build-html",function buildScss() {
    
    var htmlConfig = require(path.html.src+"/config.json");    
    
    htmlFiles
    .pipe(template(htmlConfig))
    .pipe(htmlDst);
    
});

//Builds the website.
gulp.task("build",["move-js","build-html","build-scss"],function build() { });

