#AssetLoader

##Description
JavaScript for HTML web pages.

Manages asynchronous and transitive dependency loading, with custom callbacks and error handling.

Fires callbacks you specify through a promise interface for method chaining.

Can load transitive dependencies in order, or a group of dependencies at once, or a single path.

Tracks loaded assets by asset type and identifier.

##Purpose
Reduce initial page load time by deferring requests for dependencies until they're needed.

Great for lazy loading of complex or resource-intensive subsystems.

##Download
[Production](/dist/AssetLoader.min.js)

[Source](/src/js/AssetLoader.js)

##Requires
jQuery

A browser window

An HTML document object

##Test coverage
Tested in IE 8-11, FireFox 35, Chrome 40, Safari 8, and Opera 27.

Subjected to [a battery of Jasmine tests](/tst/run.jade).

##History
Originally an internal of the ISPU JavaScript for Ace Hardware to minimally impact product page performance.
Deferred loading all the dependencies of the Store Selector until the user elected to search for nearby storefronts.

##Author
Ethan B Martin

GSI Commerce // eBay Enterprise