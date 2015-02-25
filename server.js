var express = require('express')
var jadeStatic = require('jade-static')
var app = express()

app.use( jadeStatic(__dirname) )
app.use( express.static(__dirname) )
app.listen(3001)