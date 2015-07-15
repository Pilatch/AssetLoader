var express = require("express")
var jadeStatic = require("jade-static")
var args = require("yargs").argv
var app = express()
var port = args.port || 3001

app.use( jadeStatic(__dirname) )
app.use( express.static(__dirname) )
app.listen(port)
console.log("server should be running at http://localhost:" + port)
