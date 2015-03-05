var gulp = require("gulp")
var shell = require("gulp-shell")
var watch = require("gulp-watch")
var args = require("yargs").argv
var node = "node" //could be "nodejs" if not "node"
var karma = require("karma")
var path = require("path")
var exe = require("child_process").exec
var clc = require("cli-color")

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

//we try to use the karma-cli binary if it's on the path
//should that fail, we call karma from node
gulp.task("karma", function(karmaDone) {
  var fullConfigPath = path.join(process.cwd(), "conf/karma.conf.js")
  function callKarmaServer() {
    karma.server.start({
      configFile: fullConfigPath,
      singleRun: true
    }, karmaDone)
  }
  exe("karma start " + fullConfigPath, function(error, stdout, stderr) {
    if(error && !stdout) {
      console.warn(clc.yellow("Install karma-cli to improve this experience:"), "npm install -g karma-cli")
      callKarmaServer()
    }
    else {
      console.error(stderr)
      console.log(stdout)
      karmaDone()
    }
  })
})

gulp.task("watch", function() {
  watch(["src/**", "README.md", "conf/jsdoc.conf.json"], function() {
    gulp.start("doc")
  })
  watch(["src/**", "tst/**", "conf/karma.conf.js"], function() {
    gulp.start("karma")
  })
})
