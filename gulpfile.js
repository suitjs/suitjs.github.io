var gulp     = require("gulp");
var del      = require("del");
var sass     = require("gulp-sass");
var rename   = require("gulp-rename");
var template = require("gulp-template");
var runseq   = require('run-sequence');
var fs       = require("fs");
var _        = require("lodash");
var proc     = require("child_process");

var isDebug = false;

console.log("gulp> Init.");

//Main Paths
var path = {
    src: "source",
    dst: "deploy"    
};

//File Paths
path.js   = { src: path.src+"/js",   dst: path.dst+"/js" };
path.scss = { src: path.src+"/scss", dst: path.dst+"/css" };
path.html = { src: path.src+"/html", dst: path.dst };
path.img  = { src: path.src, dst: path.dst };

//Source Streams
var jsFiles   = gulp.src(path.js.src  +"/**/*.js");
var scssFiles = gulp.src(path.scss.src+"/**/*.scss");
var htmlFiles = gulp.src([path.html.src+"/**/*.html","!"+path.html.src+"/**/*.t.html"]);
var imgFiles  = gulp.src([path.src+"/**/*.png",path.src+"/**/*.jpg",path.src+"/**/*.gif",path.src+"/**/*.svg"]);

//Destination Streams
var jsDst   = gulp.dest(path.js.dst);
var scssDst = gulp.dest(path.scss.dst);
var htmlDst = gulp.dest(path.html.dst);
var imgDst  = gulp.dest(path.img.dst);

//Delete the contents of deploy folder
gulp.task("clean",function clean(){
    return del([path.dst+"/**/*","!"+path.dst+"/CNAME*"]);
})

//Move Javascript files to the deploy folder.
gulp.task("move-js", function moveJS() {    
    return jsFiles.pipe(jsDst);
});

//Move HTML files to the deploy folder.
gulp.task("move-html", function moveHTML() {    
    return htmlFiles.pipe(htmlDst);
});

//Move img files to the deploy folder.
gulp.task("move-img", function moveImg() {    
    return imgFiles.pipe(imgDst);
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
        
    var ctx     = {};    
    ctx.data    = require("./"+path.html.src+"/config.json");
    ctx.render  = function render(p_file) {
        var s = fs.readFileSync(path.html.src+"/"+p_file).toString();        
        var c = _.template(s);
        return c(ctx);        
    };    
    htmlFiles
    .pipe(template(ctx))
    .pipe(htmlDst);
    
});

//Builds the website.
gulp.task("build",function build() {
    //Run 'clean' then asynchronously the rest    
    runseq("clean",["move-js","move-img","build-html","build-scss"]);    
 });
 
 
 //Publish the site in github pages
gulp.task("publish",function build() {
    proc.execSync("git add -A");    
    proc.execSync("git commit -a -m [vscode-publish-task]");    
    proc.execSync("git push");    
    proc.execSync("git subtree push --prefix "+path.dst+" origin master");    
 });

