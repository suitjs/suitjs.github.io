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
path.font = { src: path.src+"/fonts", dst: path.dst+"/fonts" };

//Source Streams
var jsFiles   = gulp.src(path.js.src  +"/**/*.js");
var scssFiles = gulp.src(path.scss.src+"/**/*.scss");
var htmlFiles = gulp.src([path.html.src+"/**/*.html","!"+path.html.src+"/**/*.t.html"]);
var imgFiles  = gulp.src([path.src+"/**/*.png",path.src+"/**/*.jpg",path.src+"/**/*.gif",path.src+"/**/*.svg"]);
var fontFiles = gulp.src([path.font.src+"/**/*.css",path.font.src+"/**/*.eot",path.font.src+"/**/*.woff*",path.font.src+"/**/*.svg",path.font.src+"/**/*.ttf"]);

//Destination Streams
var jsDst   = gulp.dest(path.js.dst);
var scssDst = gulp.dest(path.scss.dst);
var htmlDst = gulp.dest(path.html.dst);
var imgDst  = gulp.dest(path.img.dst);
var fontDst = gulp.dest(path.font.dst);

//Just shows the help
function defaultTask() {
    console.log("clean      - Clear all files from [./"+path.dst+"]");
    console.log("move-js    - Moves JS files from [./"+path.js.src+"] to [./"+path.js.dst+"]");
    console.log("move-img   - Moves Image files from [./"+path.img.src+"] to [./"+path.img.dst+"]");
    console.log("build-scss - Build Scss files from [./"+path.scss.src+"] to [./"+path.scss.dst+"]");
    console.log("build-html - Build Html files from [./"+path.html.src+"] to [./"+path.html.dst+"]");
    console.log("build      - Builds all project");
    console.log("publish    - Deploy the project to Github pages");
}

//Helps with the gulp task commands.
gulp.task("?",defaultTask);
gulp.task("default",defaultTask);

//Delete the contents of deploy folder
gulp.task("clean",function clean(){
    return del([path.dst+"/**/*","!"+path.dst+"/CNAME*"]);
});

//Move Javascript files to the deploy folder.
gulp.task("move-js", function moveJS() {    
    return jsFiles.pipe(jsDst);
});

//Move img files to the deploy folder.
gulp.task("move-img", function moveImg() {    
    return imgFiles.pipe(imgDst);
});

//Move font files to the deploy folder.
gulp.task("move-font", function moveFont() {    
    return fontFiles.pipe(fontDst);
});

//Build Sass files to CSS deploy folder.
gulp.task("build-scss",function buildScss() {
    
    scssFiles
    .pipe(sass.sync().on("error", sass.logError))
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
    runseq("clean",["move-js","move-font","move-img","build-html","build-scss"]);    
 });
 
 
 //Publish the site in github pages
gulp.task("publish",function build() {
    proc.execSync("git add -A",[],{silent:true});    
    proc.execSync("git commit -a -m [vscode-publish-task]",[],{silent:true});    
    proc.execSync("git push",[],{silent:true});    
    proc.execSync("git subtree push --prefix "+path.dst+" origin master",[],{silent:true});    
 });

