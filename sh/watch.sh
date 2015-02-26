#!/bin/bash
#run from base folder
node node_modules/nodemon/bin/nodemon.js \
	--watch src/js \
	--watch conf/jsdoc.conf.json \
	--watch README.md \
	-x sh/generateDocs.sh