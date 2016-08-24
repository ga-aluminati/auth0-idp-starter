var express = require('express');
var request = require("request");
var router = express.Router();

var GitHub = require('github-api');

// middleware to retrieve the identity provider's access token when the user first logged in
// if there's an auth0-user-id header, automatically get the Identity Provider access token
// ref: https://auth0.com/docs/what-to-do-once-the-user-is-logged-in/calling-an-external-idp-api
var setIdentityProviderToken = function(req, res, next) {
  // this needs to be set by the client
  // in a production app you might store the auth-0-user-id in a session variable
  // so the client doesn't have to send it with every request
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
};

router.get('/public_repos', setIdentityProviderToken, (req, res, next) => {
  var options = {
    method: 'GET',
    url: 'https://api.github.com/user/repos?access_token=' + req.idp_access_token,
    headers: {
      'accept': 'Accept: application/vnd.github.v3+json',
      'User-Agent': 'Auth0 Client'
    }
  };

  request(options, function (error, response, body) {
    if (error) next(error);

    // Now that we have the access token, set it as part of the request so that all routes
    //  can take advantage of the access token and use it as needed
    res.json(body);
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET the identity access token from the Auth0 API */
// use the setIdentityProviderToken middleware to set the identity provider's access token
//  inside of req.idp_access_token
router.get('/idp_access_token', setIdentityProviderToken, function(req, res, next) {
  // To receive the access token, there must be a header of 'auth0-user-id',
  //  middleware will automatically do a lookup and set it in req.idp_access_token
  //  before it reaches the route itself
  // Every route now is able to use the access token with any identity provider library,
  //  in this case we're simply returning it to the client
  res.json({
    idp_access_token: req.idp_access_token
  });
});

module.exports = router;
