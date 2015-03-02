VERBOSE = window.location.hash === "#VERBOSE";
DOGGIE_TEMPLATE = null; //get filled in by a test
DOGGIE_DAYCARE = { //dogs arrive in order, and their names are keys with values set to true as they arrive
	Abby: false,
	Beth: false,
	Carl: false,
	Dani: false
};
ACCEPTED_BLUES = ["#0000FF", "#0000ff", "#00f", "#00F", "rgb(0, 0, 255)", "blue"];
GLOBAL_DEPENDENCIES = {
	css: {}, //a css dependency will be added by the js file below
	js: {
		addMoreGlobalDependencies: "/tst/js/addGlobalDeps.js"
	}
};
function verbalize() {
	if(VERBOSE && window.console) {
		console.log.apply( console, Array.prototype.slice.call(arguments, 0) );
	}
}
beforeAll(function() {
	if( !$(".style-target")[0] ) {
		$('body').append('<div class="style-target">'); //we don't do this in html because karma makes that hard
	}
});
beforeEach(function () {
	jasmine.addMatchers({
		toDetermineProtocol: function(util, customEqualityTesters) {
			return {
				compare: function(dataObj) {
					var hasProtocol = window.testExposure.protocolRx.test(dataObj.url),
					testPassed = hasProtocol === dataObj.hasProtocol;
					if(!testPassed) {
						window.consele && console.error("Test for protocol failure", dataObj);
					}
					else {
						verbalize("Test for protocol passed", dataObj);
					}
					return { pass: testPassed };
				}
			};
		},
		toTestForDomain: function (util, customEqualityTesters) {
			return {
				compare: function(dataObj) {
					var testResult = testExposure.domainRx.test(dataObj.url),
					testPassed = testResult === dataObj.result;
					if(!testPassed) {
						console.error("Test for domain failure", dataObj);
					}
					else {
						verbalize("Test for domain passed", dataObj);
					}
					return { pass: testPassed };
				}
			};
		}
	});
});
describe("AssetLoader", function() {
	if(window.testExposure && testExposure.protocolRx) {
		it("has a regular expression that tests whether a path has a protocol", function() {
			var tests = [
				{
					url: "http://foo.bar.baz/blip/blob.js",
					hasProtocol: true
				},
				{
					url: "//cool.hot/lukewarm.css",
					hasProtocol: true
				},
				{
					url: "https://googs.find/me/stuff.html",
					hasProtocol: true
				},
				{
					url: "ftp://hey.kids/stop-with-all-the-downloading",
					hasProtocol: true
				},
				{
					url: "//flat.design",
					hasProtocol: true
				},
				{
					url: "//flat.design.with/path",
					hasProtocol: true
				},
				{
					url: "radio.sonic.noise",
					hasProtocol: false
				},
				{
					url: "tv.watch/all/the/time.html",
					hasProtocol: false
				},
				{
					url: "foo/bar/baz.css",
					hasProtocol: false
				},
				{
					url: "/boo/far/faz.png",
					hasProtocol: false
				}
			];
			$.each(tests, function() {
				expect(this).toDetermineProtocol();
			});
		});
	}
	if(window.testExposure && testExposure.domainRx) {	
		it("has a regular expression that tests whether an asset path contains a domain name", function() {
			var tests = [
				{
					url: "http://foo.bar.baz/blip/blob.js",
					result: true
				},
				{
					url: "//cool.hot/lukewarm.css",
					result: true
				},
				{
					url: "https://googs.find/me/stuff.html",
					result: true
				},
				{
					url: "ftp://hey.kids/stop-with-all-the-downloading",
					result: true
				},
				{
					url: "//flat.design",
					result: true
				},
				{
					url: "//flat.design.with/path",
					result: true
				},
				{
					url: "radio.sonic.noise",
					result: true
				},
				{
					url: "tv.watch/all/the/time.html",
					result: true
				},
				{
					url: "foo/bar/baz.css",
					result: false
				},
				{
					url: "/boo/far/faz.png",
					result: false
				},
				{
					url: "golf.balls/divots.css",
					result: true
				},
				{
					url: "/flat/landers",
					result: false
				}
			];
			$.each(tests, function() {
				expect(this).toTestForDomain();
			});
		});
	}
	it("can load one css file", function(done) {
		function allDoneCallback(assetType, assetId) {
			if(allDoneCallback.numTimesCalled > 0) {
				expect(allDoneCallback.numTimesCalled).toBe(0);
				throw "allDoneCallback should only be called once!"; //throwing and expecting as it might somehow be called after done()
			}
			allDoneCallback.numTimesCalled++;
			expect(assetType).toBe("css");
			expect(assetId).toBe("blueBg");
			verbalize("calling allDoneCallback with args", assetType, assetId);
			expect(ACCEPTED_BLUES).toContain(targetElement.css("background-color"));
			expect(AssetLoader.hasLoaded("css", "blueBg")).toBe(true);
			expect(eachAssetDoneCallback.numTimesCalled).toBe(1);
			expect(callAfterLoadCssBlueBg.numTimesCalled).toBe(1);
			expect( $.isEmptyObject(assetsObj.css) ).toBe(true);
			done();
		}
		allDoneCallback.numTimesCalled = 0;
		function eachAssetDoneCallback() {
			eachAssetDoneCallback.numTimesCalled++;
		}
		eachAssetDoneCallback.numTimesCalled = 0;
		function callAfterLoadCssBlueBg(assetType, assetId) {
			expect(assetType).toBe("css");
			expect(assetId).toBe("blueBg")
			callAfterLoadCssBlueBg.numTimesCalled++;
		}
		callAfterLoadCssBlueBg.numTimesCalled = 0;
		var assetsObj = {
			css: {
				blueBg: "/tst/css/blue-bg.css"
			}
		},
		targetElement = $(".style-target");
		expect(ACCEPTED_BLUES).not.toContain(targetElement.css("background-color"));
		AssetLoader.on(callAfterLoadCssBlueBg, "css", "blueBg");
		AssetLoader(assetsObj).done(allDoneCallback).each(eachAssetDoneCallback);
	});
	it("can load many files", function(done) {
		function allDoneCallback(assetType, assetId) {
			//could be a different assetType and assetId each time, depending on how quickly things load
			verbalize("calling allDoneCallback with args", assetType, assetId);
			var doggieSource = $("#doggie-template").html(),
			dogRalphieData = {
				name: "Ralphie",
				breed: "Scottish Terrier",
				coloration: "gray",
				isMale: true
			};
			DOGGIE_TEMPLATE = Handlebars.compile(doggieSource);
			var renderedDoggie = DOGGIE_TEMPLATE(dogRalphieData);
			expect(AssetLoader.hasLoaded("css", "blueBg")).toBe(true);
			expect(AssetLoader.hasLoaded("css", "redFont")).toBe(true);
			expect(AssetLoader.hasLoaded("css", "height100px")).toBe(true);
			expect(AssetLoader.hasLoaded("css", "width100px")).toBe(true);
			expect(AssetLoader.hasLoaded("js", "htmlHello")).toBe(true);
			expect(eachAssetDoneCallback.numTimesCalled).toBe(7);
			expect(callAfterLoadCssRedFont.numTimesCalled).toBe(1);
			expect(callAfterLoadCssWidth100px.numTimesCalled).toBe(1);
			expect(callAfterLoadCssHeight100px.numTimesCalled).toBe(1);
			expect(callAfterLoadJsHandlebars.numTimesCalled).toBe(1);
			expect(callAfterLoadJsHtmlHello.numTimesCalled).toBe(1);
			expect(callAfterLoadHbsDoggie.numTimesCalled).toBe(1);
			expect(callAfterAnyImg.numTimesCalled).toBe(2);
			expect( $.isEmptyObject(assetsObj.css) ).toBe(true);
			expect( $.isEmptyObject(assetsObj.js) ).toBe(true);
			expect(acceptedReds).toContain(targetElement.css("color"));
			expect( targetElement.html() ).toBe("hello!");
			expect( targetElement.css("width") ).toBe("100px");
			expect( targetElement.css("height") ).toBe("100px");
			expect(typeof renderedDoggie).toBe("string");
			targetElement.after(renderedDoggie);
			done();
		}
		function eachAssetDoneCallback() {
			eachAssetDoneCallback.numTimesCalled++;
		}
		eachAssetDoneCallback.numTimesCalled = 0;
		function callAfterLoadCssRedFont(assetType, assetId) {
			expect(assetType).toBe("css");
			expect(assetId).toBe("redFont");
			expect(acceptedReds).toContain(targetElement.css("color"));
			callAfterLoadCssRedFont.numTimesCalled++;
		}
		callAfterLoadCssRedFont.numTimesCalled = 0;
		function callAfterLoadCssWidth100px(assetType, assetId) {
			expect(assetType).toBe("css");
			expect(assetId).toBe("width100px");
			expect( targetElement.css("width") ).toBe("100px");
			callAfterLoadCssWidth100px.numTimesCalled++;
		}
		callAfterLoadCssWidth100px.numTimesCalled = 0;
		function callAfterLoadCssHeight100px(assetType, assetId) {
			expect(assetType).toBe("css");
			expect(assetId).toBe("height100px");
			expect( targetElement.css("height") ).toBe("100px");
			callAfterLoadCssHeight100px.numTimesCalled++;
		}
		callAfterLoadCssHeight100px.numTimesCalled = 0;
		function callAfterLoadJsHtmlHello(assetType, assetId) {
			expect(assetType).toBe("js");
			expect(assetId).toBe("htmlHello");
			expect( targetElement.html() ).toBe("hello!");
			callAfterLoadJsHtmlHello.numTimesCalled++;
		}
		callAfterLoadJsHtmlHello.numTimesCalled = 0;
		function callAfterLoadJsHandlebars(assetType, assetId) {
			expect(assetType).toBe("js");
			expect(assetId).toBe("handlebars");
			expect(typeof Handlebars).not.toBe("undefined");
			callAfterLoadJsHandlebars.numTimesCalled++;
		}
		callAfterLoadJsHandlebars.numTimesCalled = 0;
		function callAfterLoadHbsDoggie(assetType, assetId) {
			expect(assetType).toBe("hbs");
			expect(assetId).toBe("doggie");
			callAfterLoadHbsDoggie.numTimesCalled++;
		}
		callAfterLoadHbsDoggie.numTimesCalled = 0;
		function callAfterAnyImg(assetType, assetId) {
			expect(assetType).toBe("img");
			expect(["genderF", "genderM"]).toContain(assetId);
			verbalize("calling any image callback for", assetId);
			callAfterAnyImg.numTimesCalled++;
		}
		callAfterAnyImg.numTimesCalled = 0;

		var assetsObj = {
			css: {
				"height100px": "/tst/css/height-100px.css",
				"redFont|width100px": "/tst/mink/redFont-width100px.min.css"
			},
			hbs: {
				"doggie": "/tst/hbs/doggie.hbs"
			},
			img: {
				"genderF": "/tst/img/gender-f.png",
				"genderM": "/tst/img/gender-m.png"
			},
			js: {
				"htmlHello": "/tst/js/html-hello.js",
				"handlebars": "/tst/js/handlebars-v3.0.0.js"
			}
		},
		targetElement = $(".style-target"),
		acceptedReds = ["#FF0000", "#ff0000", "#f00", "#F00", "rgb(255, 0, 0)", "red"];

		expect(acceptedReds).not.toContain( targetElement.css("background-color") );
		expect( targetElement.css("height") ).not.toBe("100px");
		expect( targetElement.css("width") ).not.toBe("100px");
		expect( targetElement.html() ).not.toBe("hello!");
		AssetLoader.on(callAfterLoadCssRedFont, "css", "redFont");
		AssetLoader.on(callAfterLoadCssWidth100px, "css", "width100px");
		AssetLoader.on(callAfterLoadCssHeight100px, "css", "height100px");
		AssetLoader.on(callAfterLoadJsHtmlHello, "js", "htmlHello");
		AssetLoader.on(callAfterLoadJsHandlebars, "js", "handlebars");
		AssetLoader.on(callAfterLoadHbsDoggie, "hbs", "doggie");
		AssetLoader.on(callAfterAnyImg, "img");
		new AssetLoader(assetsObj).done(allDoneCallback).each(eachAssetDoneCallback);
	});
	it("can tell you if a variety of assets were loaded in one call", function() {
		expect(AssetLoader.hasLoaded({
			hbs: "doggie",
			img: ["genderF", "genderM"],
			js: "htmlHello|handlebars"
		})).toBe(true);
		expect(AssetLoader.hasLoaded({
			hbs: "doggie",
			img: ["genderF", "genderM"],
			js: "htmlHello|handlebars|gooeyMuffinCrusts"
		})).toBe(false);
	});
	it("doesn't choke when no callbacks are supplied, and works without new keyword", function(done) {
		var assetsObj = {
			css: {
				textCenter: "/tst/css/text-center.css"
			}
		};
		AssetLoader(assetsObj)
		.done(function() {
			expect(AssetLoader.hasLoaded("css", "textCenter")).toBe(true);
			done();
		});
	});
	if(window.testExposure && testExposure.guessAssetType) {
		it("guesses asset types from paths", function() {
			var path, actual, expected;
			path = "foo.bar.baz/fom/faddle.css";
			expected = "css";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "/fom/faddle.css";
			expected = "css";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "http://foo.bar.baz/fom/faddle.css";
			expected = "css";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/FADDLE.GIF";
			expected = "img";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle.png";
			expected = "img";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle.jpeg";
			expected = "img";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle.tiff";
			expected = "img";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle.hbs";
			expected = "hbs";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle.JS";
			expected = "js";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle.goyf";
			expected = "goyf";
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle"
			expected = null;
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
			path = "foo.bar.baz/fom/faddle."
			expected = null;
			actual = testExposure.guessAssetType(path);
			expect(actual).toBe(expected);
		});
	}
	it("can load based on an AssetsObject or a single path", function(done) {
		function loadedCallback() {
			loadedCallback.numTimesCalled++;
			expect(loadedCallback.numTimesCalled).toBe(1);
			if(loadedCallback.numTimesCalled > 1) {
				throw "loadedCallback should only have been called once"; //throw and expect in case called again after jasmine finishes
			}
			expect(AssetLoader.hasLoaded("css", "sans-serif")).toBe(true);
		}
		loadedCallback.numTimesCalled = 0;
		AssetLoader.load({
			css: {
				"sans-serif": "/tst/css/sans-serif.css"
			}
		}).done(loadedCallback);
		var path = "/tst/css/font-size.css";
		AssetLoader.load(path).done(function() {
			expect(["Arial, sans-serif", "Arial,sans-serif"]).toContain( $(".style-target").css("font-family") );
			expect( $(".style-target").css("font-size") ).toBe("32px");
			expect( AssetLoader.hasLoaded("css", path) ).toBe(true);
			expect(loadedCallback.numTimesCalled).toBeLessThan(2);
			done();
		});
	});
	it("lets you query whether it has loaded certain assets", function() {
		var assetType, toFind;
		assetType = "css";
		toFind = ["blueBg", "redFont", "width100px"];
		expect( AssetLoader.hasLoaded(assetType, toFind) ).toBe(true);
		assetType = "9_9_9_goblin_8_8_orchestra_7_7_7"
		expect( AssetLoader.hasLoaded(assetType, toFind) ).toBe(false);
		assetType = "hbs"
		toFind = "doggie"
		expect( AssetLoader.hasLoaded(assetType, toFind) ).toBe(true);
		toFind = "frozen_barracuda"
		expect( AssetLoader.hasLoaded(assetType, toFind) ).toBe(false);
	});
	it("doesn't load assets marked as false, and considers those marked true already loaded by a different mechanism", function(done) {
		var assetsObj = {
			css: {
				translucent: "/tst/css/translucent.css",
				greenBorder: false
			},
			js: {
				flimFlammer: true
			}
		};
		AssetLoader.load(assetsObj).done(function() {
			var targetElement = $(".style-target"),
			filterValue = targetElement.css("filter");
			expect( AssetLoader.hasLoaded("js", "flimFlammer") ).toBe(true);
			expect( AssetLoader.hasLoaded("css", "translucent") ).toBe(true);
			expect( AssetLoader.hasLoaded("css", "greenBorder") ).toBe(false);
			if( filterValue && filterValue !== "none" ) {
				verbalize("bad browser expectation")
				expect( targetElement.css("filter") ).toBe("alpha(opacity=50)");
			}
			else {
				verbalize("good browser expectation")
				expect( targetElement.css("opacity") ).toBe("0.5");
			}
			expect( targetElement.css("border-top-width").indexOf("7px") ).toBe(-1);
			done();
		});
	});
	it("implements a promise interface", function(done) {
		var badPath = "/tst/js/_froggy-anomar_.js",
		assetsObj = {
			css: {
				greenBorder: "/tst/css/green-border.css"
			},
			js: {
				froggyAnomar: badPath,
				doggieRamona: "/tst/js/doggie-ramona.js"
			}
		};
		function afterEach() {
			afterEach.numTimesCalled++;
		}
		afterEach.numTimesCalled = 0;
		function afterDone() {
			var targetElement = $(".style-target");
			afterDone.numTimesCalled++;
			expect( AssetLoader.hasLoaded("css", "greenBorder") ).toBe(true);
			expect( targetElement.css("border-top-width") ).toBe("7px");
			expect(afterEach.numTimesCalled).toBe(3);
			expect(afterDone.numTimesCalled).toBe(1);
			expect(onError.numTimesCalled).toBe(1);
			expect(shouldNotBeCalled.numTimesCalled).toBe(0);
			done();
		}
		afterDone.numTimesCalled = 0;
		function onError(assetType, assetId, path) {
			expect(assetType).toBe("js");
			expect(assetId).toBe("froggyAnomar");
			expect(path.indexOf(badPath)).not.toBe(-1);
			onError.numTimesCalled++;
		}
		onError.numTimesCalled = 0;
		function shouldNotBeCalled() {
			shouldNotBeCalled.numTimesCalled++;
		}
		shouldNotBeCalled.numTimesCalled = 0;
		AssetLoader(assetsObj).done(shouldNotBeCalled).done(afterDone).each(shouldNotBeCalled).each(afterEach).error(onError);
	});
	it("can check if an asset was loaded just based on path", function(done) {
		var path = "/tst/css/dotted-border.css";
		function expectations() {
			expect($(".style-target").css("border-top-style")).toBe("dotted");
			expect( AssetLoader.hasLoaded(path) ).toBe(true);
			done();
		}
		AssetLoader(path).done(expectations);
	});
	it("loads assets in the order given", function(done) {
		function expectations(assetType, assetId) {
			verbalize("arrival at DOGGIE_DAYCARE with assetType: " + assetType + ", assetId: " + assetId);
			expectations.numTimesCalled++;
			if(DOGGIE_DAYCARE.Dani) {
				expect(DOGGIE_DAYCARE.Carl).toBe(true);
				expect(DOGGIE_DAYCARE.Beth).toBe(true);
				expect(DOGGIE_DAYCARE.Abby).toBe(true);
			}
			else if(DOGGIE_DAYCARE.Carl) {
				expect(DOGGIE_DAYCARE.Beth).toBe(true);
				expect(DOGGIE_DAYCARE.Abby).toBe(true);
			}
			else {
				expect(DOGGIE_DAYCARE.Abby).toBe(true);
			}
		}
		expectations.numTimesCalled = 0;
		expect(DOGGIE_DAYCARE.Abby).toBe(false);
		expect(DOGGIE_DAYCARE.Beth).toBe(false);
		expect(DOGGIE_DAYCARE.Carl).toBe(false);
		expect(DOGGIE_DAYCARE.Dani).toBe(false);
		var dd = "/tst/js/doggie-daycare/";
		AssetLoader
		.load(dd + "abby.js", dd + "beth.js", {js: {carl: dd + "carl.js"}}, dd + "dani.js")
		.each(expectations)
		.done(function() {
			expect(expectations.numTimesCalled).toBe(4);
			done();
		});
	});
	it("pulls in external assets, bootstrap in this case, and handles domain resolution error", function(done) {
		var assetsObj = {
			css: {
				bootstrap: "//maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css"
			},
			js: {
				bootstrap: "//does.not.exist.ribbittoadcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"
			}
		},
		h2 = $("h2");
		function afterEach(assetType, assetId) {
			afterEach.numTimesCalled++;
			expect(assetId).toBe("bootstrap");
		}
		afterEach.numTimesCalled = 0;
		function handleError(assetType, assetId, path, errMessage) {
			handleError.numTimesCalled++;
			expect(assetType).toBe("js"); //should be a 404
			expect(assetId).toBe("bootstrap");
		}
		handleError.numTimesCalled = 0;
		expect( h2.css("font-family").toLowerCase().indexOf("helvetica neue") ).toBe(-1);
		AssetLoader.load(assetsObj).each(afterEach).error(handleError).done(function() {
			expect(afterEach.numTimesCalled).toBe(2);
			expect(handleError.numTimesCalled).toBe(1);
			expect( h2.css("font-family").toLowerCase().indexOf("helvetica neue") ).not.toBe(-1);
			done();
		});
	});
	it("can load from an external asset server", function(done) {
		if (!window.location.origin) { //polyfill
		  window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
		}
		var previousEAS = AssetLoader.externalAssetServer;
		AssetLoader.externalAssetServer = window.origin;
		AssetLoader.load("/tst/css/dog-names-blue.css").done(function() {
			expect(ACCEPTED_BLUES).toContain( $(".dog-description h2").css("color") );
			AssetLoader.externalAssetServer = previousEAS; //put it back to the way we found it
			done();
		});
	});
	it("keeps loading when javascript adds more stuff to the dependency object", function(done) {
		var dogDescImg = $(".dog-description img");
		expect( dogDescImg.css("border-top-width") ).not.toBe("2px");
		expect( $.isEmptyObject(GLOBAL_DEPENDENCIES.css) ).toBe(true);
		AssetLoader.load(GLOBAL_DEPENDENCIES).done(function() {
			expect( dogDescImg.css("border-top-width") ).toBe("2px");
			done();
		});
	});
	it("throws an exception trying to load an asset of unknown type", function() {
		var path = "/path/to/unknown.goyf",
		message = window.testExposure ? "Unsupported asset type goyf" : "3goyf";
		expect( function(){
			new AssetLoader(path);
		} ).toThrow(message);
	});
	//TODO handle javascript syntax errors better
});