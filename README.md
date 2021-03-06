#AssetLoader

Potent mechanism for deferring web page dependency requests

##Description
JavaScript for HTML web pages.

Manages asynchronous and transitive dependency loading, with custom callbacks and error handling.

Fires callbacks you specify through a promise interface.

Can load transitive dependencies in order, or a group of dependencies at once, or a single path. Allows JavaScript to add more dependencies at run time.

Tracks loaded assets by asset type and identifier. A concatenated asset can be tracked as its constituent assets.

##Purpose
Reduce initial page load time by deferring requests for dependencies until they're needed.

Great for lazy loading of complex or resource-intensive subsystems.

##Example JavaScript
All this code could be put inside an event handler that only runs when the user performs a certain action. 

In this case we load some styles, an animation library, data for the animation, and a [Handlebars template](http://handlebarsjs.com/). When they've all been loaded, we make dancing bunnies.

    AssetLoader.load({
        js: {
            animationLib: "/scripts/Ani.js",  //fictitious js library
            bunnyData: "/scripts/data/bunnies.js"
        },
        css: {
            "bunnies|bees|flowers|trees": "/min/spring.min.css",
        },
        hbs: {
            springCritters: "/templates/spring-critters.hbs"
        }
    }).done(function() {
        var tpl = Handlebars.compile( $("#spring-critters-template").html() );
        tpl(critterData.bunnies);  //render with data populated by a script we loaded, above
        Ani.mate("bunnies");  //make 'em dance!
    });

##Download
[Production](/dist/AssetLoader.min.js)

[Source](/src/js/AssetLoader.js)

###via Bower

    bower install asset-loader

####is github not resolving?

That's probably because you're behind a firewall. Tell git to use https instead of the git protocol, which may be blocked

    git config --global url."https://".insteadOf git://

##Requires
jQuery

A browser window

An HTML document object

##Test coverage
Tested in IE 8-11, FireFox 35 and 36 Chrome 40, Safari 8, and Opera 27.

Subjected to [a battery of Jasmine tests](/tst/run.jade).

##Development and Documentation
To start developing for AssetLoader or better the documentation you need [node](http://nodejs.org/), [git](http://git-scm.com/), [gulp](http://gulpjs.com/), and [bower](http://bower.io/). Then run from the base folder:

    npm install
    bower install
    gulp --port=3001

Then to view the documentation navigate to [http://localhost:3001/doc](http://localhost:3001/doc) in your web browser. Gulp will watch for changes and regenerate the documentation. If you edit a source file, or something in the tests directory karma will try to spawn a bunch of browsers and run the tests in each of them. Watch your terminal for the results.

###on Windows

Don't use Cygwin. We recommend PowerShell instead. At the time this is written, there is a bug preventing npm from installing GitHub dependencies on Cygwin.

###Generating a Distribution

For best compression of production code and granular test integration, AssetLoader is built with Mink. At this time there is not yet a public Mink service in operation. That may change in the future. 

Employees of GSI Commerce // eBay Enterprise have access to a Mink service. Not an employee, but still want to contribute? Make a pull request with your source changes, and I'll prepare it for production.

##History
Originally an internal of the ISPU JavaScript for Ace Hardware to minimally impact product page performance.
Deferred loading all the dependencies of the Store Selector until the user elected to search for nearby storefronts.

##Author
Ethan B Martin

GSI Commerce // eBay Enterprise