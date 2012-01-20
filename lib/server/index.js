var path = require('path'),
    express = require('express'),
    derby = require('derby'),
    gzip = require('connect-gzip'),
    app = require('../app'),
    connect = require('connect');

var everyauth = require('everyauth'),
    conf = require('../../conf');

// Strategy Setup

var nextUserId = 0;
var usersByFbId = {};
var usersById = {};

function addUser (source, sourceUser) {
    var user;
    if (arguments.length === 1) { // password-based
        user = sourceUser = source;
        user.id = ++nextUserId;
        return usersById[nextUserId] = user;
    } else { // non-password-based
        user = usersById[++nextUserId] = {id: nextUserId};
        user[source] = sourceUser;
    }
    return user;
}

everyauth
    .facebook
    .appId(conf.fb.appId)
    .appSecret(conf.fb.appSecret)
    .handleAuthCallbackError( function (req, res) {

    })
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
        return usersByFbId[fbUserMetadata.id] ||
            (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
    })
    .redirectPath('/');


// SERVER CONFIGURATION //

var MAX_AGE_ONE_YEAR = { maxAge: 1000 * 60 * 60 * 24 * 365 },
    root = path.dirname(path.dirname(__dirname)),
    publicPath = path.join(root, 'public'),
    staticPages = derby.createStatic(root),
    server, store;

(server = express.createServer())
  // The express.static middleware can be used instead of gzip.staticGzip
  .use(gzip.staticGzip(publicPath, MAX_AGE_ONE_YEAR))
  .use(express.favicon())

  // Uncomment to add form data parsing support
  // .use(express.bodyParser())
  // .use(express.methodOverride())

  // Uncomment and supply secret to add Derby session handling
  // Derby session middleware creates req.model and subscribes to _session
   .use(express.cookieParser())
   .use(express.session({ secret: '1ad39atlbam', cookie: MAX_AGE_ONE_YEAR }))
   .use(everyauth.middleware())

  // Remove to disable dynamic gzipping
  .use(gzip.gzip())

  // The router method creates an express middleware from the app's routes
  .use(app.router())
  .use(server.router);

everyauth.helpExpress(server);

// AUTHENTICATION


// ERROR HANDLING //

server.configure('development', function() {
  // Log errors in development only
  server.error(function(err, req, res, next) {
    if (err) console.log(err.stack ? err.stack : err);
    next(err);
  });
});

server.error(function(err, req, res) {
  // Customize error handling here //
  var message = err.message || err.toString(),
      status = parseInt(message);
  if (status === 404) {
    staticPages.render('404', res, {url: req.url}, 404);
  } else {
    res.send( ((status >= 400) && (status < 600)) ? status : 500 );
  }
});


server.all('*', function(req) {
    throw "404: " + req.url;
});


// SERVER ONLY ROUTES //


// STORE SETUP //

store = app.createStore({ listen: server });

// TODO: Remove when using a database //
// Clear all data every time the node server is started
store.flush();
var port = process.env.PORT || 3000
server.listen(port);
console.log('Express server started in %s mode', server.settings.env);
console.log('Go to: http://localhost:%d/', server.address().port);
