var gulp = require("gulp")
var shell = require("gulp-shell")
var watch = require("gulp-watch")
var args = require("yargs").argv
var node = process.argv[0] //could be "nodejs" if not "node"

gulp.task("default", function(){
  gulp.start("watch")
  gulp.start("server")
})

gulp.task("doc", shell.task([
  node + " node_modules/jsdoc/jsdoc.js"
  + " --destination doc"
  + " --template node_modules/ink-docstrap/template/"
  + " --configure conf/jsdoc.conf.json"
  + " src/js/AssetLoader.js README.md"
]))

gulp.task("server", shell.task([
  node + " server.js --port=" + (args.port || 3001)
]))

gulp.task("karma", shell.task([
  "karma start conf/karma.conf.js"
], {
  ignoreErrors: true
}))

gulp.task("watch", function() {
  watch(["src/**", "README.md", "conf/jsdoc.conf.json"], function() {
    gulp.start("doc")
  })
  watch(["src/**", "tst/**", "conf/karma.conf.js"], function() {
    gulp.start("karma")
  })
})
