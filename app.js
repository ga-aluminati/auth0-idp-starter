var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');

// Load environment variables needed for the app to run
require('dotenv').config();

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// middleware to retrieve the identity provider's access token when the user first logged in
// if there's an auth0-user-id header, automatically get the Identity Provider access token
// ref: https://auth0.com/docs/what-to-do-once-the-user-is-logged-in/calling-an-external-idp-api
app.use(function(req, res, next) {
  // this needs to be set by the client
  if (req.header('auth0-user-id')) {
    var options = {
      method: 'POST',
      url: process.env.AUTH0_DOMAIN + '/oauth/token',
      headers: {
        'content-type': 'application/json'
      },
      body: {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_DOMAIN + '/api/v2/',
        grant_type: 'client_credentials'
      },
      json: true
    };

    // First we have to use our client_id and client_secret to obtain an access token we can
    //  use to query the Auth0 API which holds the access token that was granted by the
    //  Identity Provider to Auth0 when the user first logged in
    request(options, function (error, response, body) {
      if (error) next(error);

      // Now that we have the access token, we make a request to get the user profile, only
      //  now the response includes an "identities" array, with the access token we want
      var options = {
        method: 'GET',
        url: process.env.AUTH0_DOMAIN + '/api/v2/users/' + req.header('auth0-user-id'),
        headers: {
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + body.access_token
        }
      };

      request(options, function (error, response, body) {
        if (error) next(error);

        // Now that we have the access token, set it as part of the request so that all routes
        //  can take advantage of the access token and use it as needed
        body = JSON.parse(body);
        req.idp_access_token = body.identities[0].access_token;

        next();
      });
    });
  } else {
    next();
  }
});

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
