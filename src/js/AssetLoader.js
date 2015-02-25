/**
 * A browser Window object. Aliased as <code>global</code>
 * @external window
 */

/**
 * An HTML Document object. Aliased as <code>doc</code>
 * @external document
 */

/**
 * Aliased as <code>$</code>
 * @external "jQuery"
 * @see {@link http://jquery.com/|jQuery website}
 */
(function (global, doc, $) {

	var assetIdDelimeter = "|",
	loadedAssets = new LoadedAssets(),
	loadCssPollingInterval = 99, //milliseconds
	domainRx = /^(?:(?:\w+:)?\/\/)?(?:[^\/\.]+\.)+[^\/\.]+/, //tests whether a path has a domain name
	protocolRx = /^(?:\w+:)?\/\//, //test whether a path has a protocol
	//repeatedly used constructs, aliased for compression
	S_IMG = "img",
	S_STRING = "string",
	S_OBJECT = "object",
	S_HEAD = "head",
	F_TIMEOUT = global.setTimeout,
	F_INTERVAL = global.setInterval,
	F_CLEAR_INTERVAL = global.clearInterval,
	F_CLEAR_TIMEOUT = global.clearTimeout,
	F_ATTACH_EVENT = global.attachEvent,
	F_NOOP = $.noop,
	F_IN_ARRAY = $.inArray,
	//error indicators
	E_01 = 1,
	E_02 = 2,
	E_03 = 3,
	E_04 = 4,
	E_05 = 5,
	E_06 = 6,
	E_07 = 7,
	E_08 = 8;

	function F_LOWERCASE(str) {
		return str.toLowerCase();
	}

	function guessAssetType(path) {
		var match = /\.(\w+?)$/.exec( F_LOWERCASE(path) ),
		fileExtension = match ? match[1] : null;
		if( ~F_IN_ARRAY(fileExtension, ['bmp', 'bpg', 'gif', 'jpeg', 'jpg', 'png', 'tiff', 'webp']) ) {
			return S_IMG;
		}
		return fileExtension;
	}

	//MINK-DELETE-START
		//make the error indicators human readable in development mode
		E_01 = "Could not guess asset type for path ";
		F_ATTACH_EVENT = global.attachEvent,
		E_02 = "Unsupported type to load ";
		E_03 = "Unsupported asset type ";
		E_04 = "gecko/webkit load CSS timeout reached";
		E_05 = "link.styleSheet.cssText empty";
		E_06 = "node error event";
		E_07 = "Could not guess asset type of path ";
		E_08 = "Unsupported argument structure ";
		//expose internals for testing
		global.testExposure = {
			domainRx: domainRx,
			protocolRx: protocolRx
		};
	//MINK-DELETE-END

	function loadInOrder() {
		var args = Array.prototype.slice.call(arguments, 0),
		allDone = F_NOOP,
		eachDone = F_NOOP,
		errHandler = F_NOOP,
		promise = {
			done: function(callback) {
				allDone = callback;
				return promise;
			},
			error: function(callback) {
				errHandler = callback;
				return promise;
			},
			each: function(callback) {
				eachDone = callback;
				return promise;
			}
		};
		function loadNext() {
			if(args.length) {
				F_TIMEOUT(function() {
					new AssetLoaderClass( args.shift() )
					.done(loadNext)
					.each(eachDone)
					.error(errHandler);
				}, 4);
			}
			else {
				allDone();
			}
		}
		loadNext();
		return promise;
	}
	
	function AssetLoaderClass(stuffToLoad) {
		if(arguments.length > 1) {
			return loadInOrder.apply(this, arguments);
		}
		var self = this,
		allAssetsLoadedCallback = F_NOOP,
		afterEach = F_NOOP,
		handleError = F_NOOP,
		numToLoad,
		numLoaded,
		assets, //clone of stuffToLoad for internal use
		assetServer, //akURL and whatnot, if in use
		singlePath,
		guessedAssetType;
		if(typeof stuffToLoad === S_STRING) {
			singlePath = stuffToLoad;
			if(guessedAssetType = guessAssetType(singlePath)) {
				stuffToLoad = {};
				stuffToLoad[guessedAssetType] = {};
				stuffToLoad[guessedAssetType][singlePath] = singlePath;
			}
			else {
				throw E_01 + singlePath;
			}
		}
		else if( !$.isPlainObject(stuffToLoad) ) {
			throw E_02 + stuffToLoad;
		}

		//lazy initialization is crucial because of the clone operation, 
		//and how extensions are allowed to set certain assets to false so they won't be loaded
		function initialize() {
			numToLoad = 0;
			numLoaded = 0;
			assets = $.extend(true, {}, stuffToLoad); //clone from the reference
			assetServer = AssetLoaderClass.externalAssetServer; //just in case this changed somehow
			if(assetServer && !protocolRx.test(assetServer)) {
				assetServer = '//' + assetServer;
			}
			//add the assets map to the to-load-list only if there is new stuff to load
			$.each(assets, function(type, idToPathMap){
				//count how many assets of this type need to be loaded
				if($.isEmptyObject(idToPathMap)){ //don't bother if there's nothing of this type that's new
					return true; //effectively a continue statement
				}
				$.each(idToPathMap, function(assetId, path){
					path && path !== true && numToLoad++; //only count this as something that needs to be loaded if it's not falsey or true
				});
				stuffToLoad[type] = {}; //clear it out so we don't load things multiple times
			});
		}

		function markAssetAsLoaded(type, assetId) {
			loadedAssets.add(type, assetId);
		}

		function assetLoaded(type, assetId) { //called after every asset is loaded
			//remember that we have, in fact, loaded it
			markAssetAsLoaded(type, assetId);
			afterEach(type, assetId); //we just loaded a single asset, but not the last
			if(++numLoaded == numToLoad) { //have we loaded our final asset?
				//see if there are more that need loading, now that we've loaded an entire module, I guess
				initialize();
				if(!numToLoad) { //nope, we're done
					return allAssetsLoadedCallback(type, assetId);
				}
				else {
					go(); //load the new stuff
				}
			}
		}

		/**
		 * Set a callback that's called after each asset loaded by this specific AssetLoader.
		 * @name AssetLoader#each
		 * @function
		 * @param  {Function} callback what gets called, passed two String params: assetType, assetId
		 * @return {AssetLoader} for method chaining via the {@link LoaderPromise} interface.
		 */
		self.each = function(callback) {
			afterEach = callback;
			return self;
		};

		/**
		 * Set a callback for when all the assets have been loaded by this specific AssetLoader.
		 * @name AssetLoader#done
		 * @function
		 * @param  {Function} callback what gets called, passed two String params: assetType, assetId
		 * @return {AssetLoader} for method chaining via the {@link LoaderPromise} interface.
		 */
		self.done = function(callback) {
			allAssetsLoadedCallback = callback;
			return self;
		};

		/**
		 * Set an error handler for when loading an asset goes wrong, specific to this AssetLoader.
		 * @name AssetLoader#error
		 * @function
		 * @param  {Function} callback what gets called, passed two String params: assetType, assetId
		 * @return {AssetLoader} for method chaining via the {@link LoaderPromise} interface.
		 */
		self.error = function(callback) {
			handleError = callback;
			return self;
		};

		/**
		 * Set callbacks to be fired when certain assets are loaded.
		 * Similar to {@link AssetLoader.on}.
		 * @name AssetLoader#on
		 * @function
		 * @param {Function} callback what gets called, passed two String params: assetType, assetId
		 * @param {SupportedAssetType} assetType the type of asset you're interested in
		 * @param {String} [assetId] the specific asset ID you're interested in. Omit to fire callback for any asset of assetType.
		 * @return {AssetLoader} for method chaining via the {@link LoaderPromise} interface.
		 */
		self.on = function() {
			AssetLoaderClass.on.apply(this, arguments);
			return self;
		};

		/**
		 * Go get all the assets!
		 * Automatically called at the end of this constructor.
		 * @private
		 * @return {AssetLoader} for method chaining via the {@link LoaderPromise} interface.
		 */
		function go() {
			if(!numToLoad) {
				if(initialize() && !numToLoad) {
					//nothing to load; we're done here.
					//let the load function return its self (promise), then fire the all-done callback
					F_TIMEOUT(allAssetsLoadedCallback, 4);
				}
			}
			$.each(assets, function(type, idToPathMap) {
				$.each(idToPathMap, function(assetId, path){
					function loadComplete() {
						assetLoaded(type, assetId);
					}
					if(!path) {
						return true; //continue if the asset was set to false
					}
					else if(path === true) { //if a developer has specifically set this asset to true, then assume it's already loaded
						markAssetAsLoaded(type, assetId);
						return true; //continue
					}
					//only prepend the imageServer to the path if the path has no protocol, and no domain name on it
					if( assetServer && !protocolRx.test(path) && !domainRx.test(path) ) {
						path = assetServer + ( path.substr(0, 1) == '/' ? '' : '/' ) + path;
					}
					//if for whatever reason a domain name is specified for the path, but without a protocol,
					//prepend the default protocol onto that path to make sure it's properly found
					if(domainRx.test(path) && !protocolRx.test(path)) {
						path = '//' + path;
					}
					//slap a cache buster onto the end of the path, if it doesn't already have a URL parameter
					if(typeof AssetLoaderClass.cacheBuster != 'undefined' && !~path.indexOf('?')) {
						path += '?v=' + AssetLoaderClass.cacheBuster;
					}
					switch(type){
						case 'css':
							loadCss(path, loadComplete, function(errMessage) {
								handleError(type, assetId, path, errMessage)
							});
						break;
						case 'js':
							$.ajax({
								url: path,
								cache: true,
								crossDomain: !!assetServer,
								dataType: "script",
								success: loadComplete,
								error: function(){
									handleError(type, assetId, path);
									loadComplete();
								}
							});
						break;
						case 'hbs':
							$.ajax({
								url: path,
								cache: true,
								crossDomain: !!assetServer,
								dataType: 'html',
								success: function(resp) {
									$(S_HEAD).append(resp);
									loadComplete();
								},
								error: function() {
									handleError(type, assetId, path);
									loadComplete();
								}
							});
						break;
						case S_IMG:
							$( doc.createElement(S_IMG) )
							.on("load", loadComplete)
							.on("error", function(){
								handleError(type, assetId, path);
								loadComplete();
							})
							.attr('src', path);
						break;
						default:
							throw E_03 + type;
					}
				});
			}); //end .each
			return self;
		}; //end go
		return go(); //for use without new keyword (returns self)
	}; //end AssetLoaderClass

	//private function for loading stylesheets
	//modified from https://raw.github.com/rgrove/lazyload/release-2.0.3/lazyload.js
	function loadCss(path, callback, handleError) {
		var userAgent = navigator.userAgent,
		isGecko = /Gecko\//.test(userAgent),
		isWebkit = /AppleWebKit\//.test(userAgent),
		head = doc[S_HEAD] || $(S_HEAD)[0],
		node,
		intervalId,
		pathRx = /^(\w*:?\/\/)?([^\/]+)\/(.+)$/, //breaks the path into 1: protocol, 2: domain, 3: file
		timeoutId,
		handleError = handleError || F_NOOP;

		if(isGecko){
			node = doc.createElement('style');
		}
		else {
			node = doc.createElement('link');
			node.href = path;
			node.rel = 'stylesheet';
			node.type = 'text/css';
		}
		if(isGecko || isWebkit){ //in either case, we set a timeout because we don't have access to node.onerror
			timeoutId = F_TIMEOUT(function(){
				F_CLEAR_INTERVAL(intervalId);
				handleError(E_04);
				callback();
			}, 3000);
			if(isGecko){
				node.textContent = '@import "' + path +'"'; //set an import statement in the style tag
				intervalId = F_INTERVAL(function(){
					try{
						if(node.sheet && node.sheet.cssRules.length){
							F_CLEAR_INTERVAL(intervalId);
							F_CLEAR_TIMEOUT(timeoutId);
							callback();
						}
					}
					catch(exception){}
				}, loadCssPollingInterval);
			}
			else{ //it's webkit
				var pathParts = pathRx.exec(path), //if pathParts isn't null, then path is an absolute path
				pathProtocol,
				pathDomain,
				pathFile,
				pathIsAbsolute = false;

				if(pathParts && pathParts[1]) { //path is an absolute URL, because it has a protocol at the front
					pathIsAbsolute = true;
					pathProtocol = F_LOWERCASE(pathParts[1]);
					if($.trim(pathProtocol) == '//') { //user means, "use whatever protocol this page uses"
						pathProtocol = global.location.protocol + '//';
					}
					pathDomain = F_LOWERCASE(pathParts[2]);
					pathFile = pathParts[3]; //unix filenames are case sensitive
				}
				intervalId = F_INTERVAL(function(){
					$.each(doc.styleSheets, function(index, styleSheet) {
						var cssFound = false,
						sheetHref = styleSheet.href,
						sheetHrefParts,
						sheetProtocol,
						sheetDomain,
						sheetFile;

						if(pathIsAbsolute) {
							sheetHref && ( sheetHrefParts = pathRx.exec(sheetHref) );

							if(sheetHrefParts) { //the stylesheet we're currently looking at is also an absolute url
								sheetProtocol = F_LOWERCASE(sheetHrefParts[1]);
								sheetDomain = F_LOWERCASE(sheetHrefParts[2]);
								sheetFile = sheetHrefParts[3]; //unix filenames are case sensitive

								cssFound = ( sheetProtocol == pathProtocol && sheetDomain == pathDomain && sheetFile == pathFile);
							}
						}
						else { //it's a relative file name
							cssFound = ( sheetHref && ~sheetHref.indexOf(path) );
						}
						if(cssFound) {
							F_CLEAR_TIMEOUT(timeoutId);
							F_CLEAR_INTERVAL(intervalId);
							callback();
							return false; //break from the jQuery.each loop
						}
					});
				}, loadCssPollingInterval);
			}

		}
		else if(F_ATTACH_EVENT) { //some form of old IE
			node.onreadystatechange = function() {
				if(this.readyState == 'complete') {
					try {
						if( ! $.trim(this.styleSheet.cssText) ) {
							handleError(E_05);
						}
					}
					catch(e) {
						handleError(e.message);
					}
					callback();
				}
			};
		}
		else{
			node.onload = callback;
		}
		if(!F_ATTACH_EVENT) { //old IE already has an error handler, above
			node.onerror = function(evt) {
				handleError(E_06);
				callback();
			};
		}
		head.appendChild(node);
	} //end loadCss

	//private class for tracking which assets have been loaded
	//an instance of this is assigned to var loadedAssets
	function LoadedAssets() {
		var self = this,
		loadedAssets = {},
		callbacks = {}; //in the form of assetType: { assetId: [callback1, callback2, ... ] }

		function fireCallbacks(assetType, assetIdsArray) {
			if(typeof callbacks[assetType] === "object") {
				//fire callbacks that would fire regardless of which asset of this type is loaded
				var typeSpecificCallbacks = callbacks[assetType][assetIdDelimeter] || [];
				$.each(assetIdsArray, function(index, assetId) {
					var assetSpecificCallbacks = callbacks[assetType][assetId] || [],
					toCall = typeSpecificCallbacks.concat(assetSpecificCallbacks);
					$.each(toCall, function() {
						this.call(self, assetType, assetId);
					});
				});
			}
		}

		self.add = function(assetType, assetId) {
			if(!loadedAssets[assetType]) {
				loadedAssets[assetType] = [];
			}
			var assetIdsArray = assetId.split( assetIdDelimeter );
			loadedAssets[assetType] = loadedAssets[assetType].concat(assetIdsArray);
			fireCallbacks(assetType, assetIdsArray);
		};

		/**
		 * @see AssetLoader.on
		 */
		self.on = function(callback, assetType, assetId) {
			//when called without the third argument, the callback will fire whenever any asset of that type is loaded
			assetId = assetId || assetIdDelimeter;
			if(!callbacks[assetType]) {
				callbacks[assetType] = {};
			}
			if(!callbacks[assetType][assetId]) {
				callbacks[assetType][assetId] = [];
			}
			callbacks[assetType][assetId].push(callback);
		}

		/**
		 * @see AssetLoader.hasLoaded
		 */
		self.has = function(assetType, toFind) {
			var args = arguments,
			containsAllThese = true; //innocent until proven guilty

			if(args.length === 1 && typeof args[0] === S_STRING) { //just checking for an individual asset by its path
				toFind = args[0];
				assetType = guessAssetType(toFind);
				if(!assetType) {
					throw E_07 + toFind;
				}
			}
			if(typeof assetType === S_STRING) { //we're only interested in one type of asset
				if(!loadedAssets[assetType]) {
					return false;
				}
				if(typeof toFind == S_STRING) { //we're only asking about a single asset
					if(toFind.indexOf(assetIdDelimeter) !== -1) {
						return containsAllThese = self.has(assetType, toFind.split(assetIdDelimeter));
					}
					return !!~F_IN_ARRAY(toFind, loadedAssets[assetType]);
				}
				if(typeof toFind == S_OBJECT) { //we're interested in multiple assets
					$.each(toFind, function(assetIdIndex, currentAssetId) { //loop through the array of assetIds
						if(typeof currentAssetId != S_STRING) {
							throw E_08 + args;
						}
						return containsAllThese = self.has(assetType, currentAssetId); //set outside value and break loop if false
					});
					return containsAllThese;
				}
			}
			if(args.length == 1 && typeof assetType == S_OBJECT) {
				$.each(assetType, function(currentAssetType, assetIdStringOrArray) {
					return containsAllThese = self.has(currentAssetType, assetIdStringOrArray);
				});
				return containsAllThese;
			}
			throw E_08 + args;
		};

	}

	$.extend(AssetLoaderClass, {
		/**
		 * Another domain that static assets should be loaded from.
		 * <code>undefined</code> by default. 
		 * When falsey, assets will be loaded relative to the current domain.
		 * @name AssetLoader.externalAssetServer
		 * @type {String}
		 */
		
		/**
		 * Apply the value you specify here as a query parameter to each path that gets requested.
		 * <code>undefined</code> by default for performance reasons.
		 * @name AssetLoader.cacheBuster
		 * @type {String|Number|undefined}
		 */

		/**
		 * Register a callback to be fired when a specific asset is loaded, or after any asset of a given type is loaded.
		 * @memberOf AssetLoader
		 * @static
		 * @function
		 * @param  {Function} callback  called with String parameters: assetType, assetId
		 * @param  {String}   assetType what type of asset we're interested in
		 * @param  {String}   [assetId]   if we're waiting for a specific asset to fire the callback, its assetId
		 */
		on: loadedAssets.on,
		/**
		 * Guess what type of file we're dealing with.
		 * @static
		 * @memberOf AssetLoader
		 * @function
		 * @param  {String} path url or local path to the asset
		 * @return {SupportedAssetType}	{@link SupportedAssetType} when confident
		 * @return {null} null when not confident
		 */
		guessAssetType: guessAssetType,
		/**
		 * Determine whether a specific asset has already been loaded. Has multiple parameter structures for convenience.
		 * @example
		 * <caption>Determine if the styles for the overlay were loaded.</caption>
		 * AssetLoader.hasLoaded("css", "overlay");
		 * 
		 * @example
		 * <caption>
		 * Determine whether multiple assets you specify have been loaded.
		 * E.g. determine if the extender, and overlay css and js have been loaded.</caption>
		 * AssetLoader.hasLoaded({
		 * 	js: ['extender', 'overlay'],
		 * 	css: 'overlay'
		 * });
		 * 
		 * @example
		 * <caption>
		 * Just pass in a path, and hope for the best.
		 * </caption>
		 * AssetLoader.hasLoaded("/sodas/DrRosemary.png");
		 * 
		 * @memberOf AssetLoader
		 * @function
		 * @static
		 * @param {String|String[]|Object} assetType When a String: css, js, img
		 * @param {String|String[]} toFind the id(s) of the thing to check for
		 * @return {boolean} - whether asset(s) are loaded that match this assetId and type
		 */
		hasLoaded: loadedAssets.has,
		/**
		 * Load up assets in order specified in the arguments.
		 * @memberOf AssetLoader
		 * @param {...(AssetsObject|String)} stuffToLoad What assets need to be loaded.
		 * @return {LoaderPromise}
		 */
		load: function() {
			return loadInOrder.apply(this, arguments);
		}
	});

	/**
	 * <p>An object that can load up a bunch of static assets and fire callbacks at appropriate times.</p>
	 * @implements {LoaderPromise}
	 * @example
	 * <caption>We know what assets are required to make a fancy dialog box.
	 * For performance reasons we don't initially load those assets on the page
	 * because users don't always open the dialog box.
	 * Instead we wait for the user to hit a certain button, then request
	 * external and local CSS, button images, a HandleBars template, and more JavaScript.
	 * Once they're all loaded we fire some JavaScript to render the dialog box.
	 * Here's where the AssetLoader comes in:
	 * </caption>
	 * new AssetLoader({
	 *   css: {
	 *     darkUI: "//ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/themes/ui-darkness/jquery.ui.theme.css",
	 *     customDialog: "/css/talkybox.css"
	 *   },
	 *   hbs: {
	 *     customDialog: "/templates/talkybox.hbs"
	 *   },
	 *   img: {
	 *     dialogSprite: "/graphics/dialogButtons.png"
	 *   },
	 *   js: {
	 *     jQueryUI: "/js/jquery-ui-1.11.3.min.js",
	 *     talkybox: "/js/makeTalkybox.js",
	 *     dialogRenderer: "/js/DialogTemplateRenderer.js"
	 *   }
	 * }).done(function() {
	 *   DialogTemplateRenderer.render(talkybox);
	 * });
	 * @constructor
	 * @param {...(AssetsObject|String)} stuffToLoad What assets you need to request.
	 */
	this.AssetLoader = AssetLoaderClass;

})(window, document, jQuery);

/**
 * A plain object that could contain multiple {@link AssetIdPathMap}s.
 * Each key in the top level of an AssetsObject must be a {@link SupportedAssetType}.
 * Each gets its own property to show what type of assets it references.
 * 
 * When loading JavaScript, if more paths are added to the AssetsObject,
 * the AssetLoader's done callback will not fire until those newly added assets are loaded too,
 * and any new assets they add... and so on.
 * @example
 * var assetsObj = {
 *   css: {
 *     "foo": "/path/to/foo.css"
 *   },
 *   js: {
 *     "foo": "/path/to/foo.js",
 *     "bar": "/path/to/bar.js"
 *   }
 * };
 * @example
 * <caption>Concatenated assets can have their constituent asset identifiers marked as loaded
 * by {@link AssetLoader.hasLoaded} while pointing to only one path.
 * Use the <code>|</code> pipe character to separate
 * asset IDs in the key of an {@link AssetIdPathMap}.</caption>
 * var assetsObj = {
 *   css: {
 *     "foo|bar|baz": "/min/foobarbaz.min.css"
 *   }
 * };
 * @typedef {Object} AssetsObject
 * @property {AssetIdPathMap} [css] css assets to be loaded
 * @property {AssetIdPathMap} [js] javascript assets to be loaded
 * @property {AssetIdPathMap} [img] image assets to be loaded
 * @property {AssetIdPathMap} [hbs] Handlebars templates to be loaded
 */

/**
 * A plain object that is a map of asset IDs to their respective web paths.
 * Contains only one type of asset, whether stylesheets or images, etc.
 * @example
 * {
 * 	"overlay": "/css/gray-overlay.css",
 * 	"dialogBox": "/css/schnazzy-dialog.css"
 * }
 * @typedef {Object} AssetIdPathMap
 */

/**
 * A promise object that allows for assigning callbacks to loading events.
 * Each of its functions returns the LoaderPromise, so you can chain method calls.
 * @example var promise = AssetLoader.load("/css/flowers.css", "/js/flowers-petals.js");
 * promise.each(singleAssetLoadedHandler).done(flowersLoadedCallback).error(errHandler);
 * @typedef {Object} LoaderPromise
 * @property {LoaderCallbackSetter} done register a callback to be fired after the loader has loaded all desired assets.
 * @property {LoaderCallbackSetter} each register a callback for the loader to fire after each asset it loads.
 * @property {LoaderCallbackSetter} error register an error handler to be called when the loader encounters an error loading an asset.
 */

/**
 * @callback LoaderCallbackSetter
 * @param {Function} callback to be called when the given event occurs. Will be passed two String arguments: assetType, assetId.
 * For error handlers, there could also be one or two additional parameters: path, errorMessage.
 * @return {LoaderPromise} The calling object for method chaining, so you can set different callbacks in one line of code.
 */

/**
 * One of the following:
 * <code>'css'</code>, <code>'hbs'</code>, <code>'img'</code>, <code>'js'</code>
 * @typedef {String} SupportedAssetType
 */