#!/bin/bash
# Run from base folder.
nodejs node_modules/jsdoc/jsdoc.js \
	--destination doc \
	--template node_modules/ink-docstrap/template/ \
	--configure conf/jsdoc.conf.json \
	src/js/AssetLoader.js src/README.md
