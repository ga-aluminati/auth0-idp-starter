$(document).ready(function() {

  var lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
    auth: {
      params: { scope: 'openid email' } //Details: https://auth0.com/docs/scopes
    }
  });

  $('.btn-login').click(function(e) {
    e.preventDefault();
    lock.show();
  });

  $('.btn-logout').click(function(e) {
    e.preventDefault();
    logout();
  })

  lock.on("authenticated", function(authResult) {
    lock.getProfile(authResult.idToken, function(error, profile) {
      if (error) {
        // Handle error
        return;
      }
      localStorage.setItem('id_token', authResult.idToken);
      // Display user information
      show_profile_info(profile);

      // There is middleware set up so that if a header of 'auth0-user-id' is set,
      //  then the access token obtained from the identity provider (e.g. Facebook, GitHub, etc)
      //  will be set and able to be used by any route in the application
      $.ajaxSetup({
        beforeSend: function(xhr) {
          xhr.setRequestHeader('auth0-user-id', profile.user_id);
        }
      });

      // Sometimes we might want to use something like the Facebook JS client library, so we can
      //  get the access token from our backend, store in localStorage and use it within the client
      $.ajax({
        url: '/idp_access_token',
        method: 'GET'
      }).done(function(response) {
        if (response.idp_access_token) {
          console.log('Identity provider access token: ', response.idp_access_token);

          // We can later retrieve this access token and use it in a client library if we wanted to
          localStorage.setItem('idp_access_token', response.idp_access_token);
        }
      });
    });
  });

  //retrieve the profile:
  var retrieve_profile = function() {
    var id_token = localStorage.getItem('id_token');
    if (id_token) {
      lock.getProfile(id_token, function (err, profile) {
        if (err) {
          return alert('There was an error getting the profile: ' + err.message);
        }
        // Display user information
        show_profile_info(profile);
      });
    }
  };

  var show_profile_info = function(profile) {
     $('.nickname').text(profile.nickname);
     $('.btn-login').hide();
     $('.avatar').attr('src', profile.picture).show();
     $('.btn-logout').show();
  };

  var logout = function() {
    localStorage.removeItem('id_token');
    window.location.href = "/";
  };

  retrieve_profile();
});
