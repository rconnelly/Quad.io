

var connect = require('connect'),
everyauth = module.exports = {};

everyauth.Promise = require('everyauth/lib/promise');
everyauth.debug = false;
everyauth.helpExpress = require('everyauth/lib/expressHelper');

everyauth.middleware = function () {
    var app = connect(
        function registerReqGettersAndMethods (req, res, next) {
            var methods = everyauth._req._methods
                , getters = everyauth._req._getters;
            for (var name in methods) {
                req[name] = methods[name];
            }
            for (name in getters) {
                Object.defineProperty(req, name, {
                    get: getters[name]
                });
            }
            next();
        }
        , function fetchUserFromSession (req, res, next) {
            var sess = req.session
                , auth = sess && sess.auth
                , everymodule, findUser;
            if (!auth) return next();
            if (!auth.userId) return next();
            everymodule = everyauth.everymodule;
            if (!everymodule._findUserById) return next();
            var pause = __pause(req);
            everymodule._findUserById(auth.userId, function (err, user) {
                if (err) throw err; // TODO Leverage everyauth's error handling
                if (user) req.user = user;
                else delete sess.auth;
                next();
                pause.resume();
            });
        }
        , connect.router(function (app) {
            var modules = everyauth.enabled
                , _module;
            for (var _name in modules) {
                _module = modules[_name];
                _module.validateSteps();
                _module.routeApp(app);
            }
        })
    );
    return app;
};

everyauth._req = {
    _methods: {}
    , _getters: {}
};

everyauth.addRequestMethod = function (name, fn) {
    this._req._methods[name] = fn;
    return this;
};

everyauth.addRequestGetter = function (name, fn, isAsync) {
    this._req._getters[name] = fn;
    return this;
};

everyauth
    .addRequestMethod('logout', function () {
    var req = this;
    delete req.session.auth;

}).addRequestGetter('loggedIn', function () {
        var req = this;
        if (req.session && req.session.auth && req.session.auth.loggedIn) {
            return true;
        } else {
            return false;
        }
    });

everyauth.modules = {};
everyauth.enabled = {};

// Grab all filenames in ./modules -- They correspond to the modules of the same name
// as the filename (minus '.js')

var basePath = __dirname + '/../../node_modules/everyauth/';
var fs = require('fs');
var files = fs.readdirSync(basePath + 'lib/modules');
var includeModules = files.map( function (fname) {
    return fname.substring(0, fname.length - 3);
});
for (var i = 0, l = includeModules.length; i < l; i++) {
    var name = includeModules[i];

    // Lazy enabling of a module via `everyauth` getters
    // i.e., the `facebook` module is not loaded into memory
    // until `everyauth.facebook` is evaluated
    Object.defineProperty(everyauth, name, {
        get: (function (name) {
            return function () {
                var mod = this.modules[name] || (this.modules[name] = require(basePath + 'lib/modules/' + name));
                // Make `everyauth` accessible from each auth strategy module
                if (!mod.everyauth) mod.everyauth = this;
                if (mod.shouldSetup)
                    this.enabled[name] = mod;
                return mod;
            }
        })(name)
    });
};



// Strategy Setup


everyauth
    .facebook
    .appId(conf.fb.appId)
    .appSecret(conf.fb.appSecret)
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
        return usersByFbId[fbUserMetadata.id] ||
            (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
    })
    .redirectPath('/');
