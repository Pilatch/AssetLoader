var express = require('express')
var jadeStatic = require('jade-static')
var app = express()
var port = process.argv[2] ? parseInt(process.argv[2]) : 3001

app.use( jadeStatic(__dirname) )
app.use( express.static(__dirname) )
app.listen(port)