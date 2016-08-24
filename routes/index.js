var express = require('express');
var request = require("request");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET the identity access token from the Auth0 API */
router.get('/idp_access_token', function(req, res, next) {
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
