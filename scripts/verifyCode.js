'use strict';

var request = require("request");
var Q = require("q");

var verifyCode = function (config) {

  return function (code) {

    var deferred = Q.defer();

    var options = {
      method: 'GET',
      url: 'https://' + config.TENANT_DOMAIN + '/api/v2/users',
      qs: {
        q: 'app_metadata.code:"' + code + '" AND identities.connection:"' + config.CONNECTION_NAME + '"',
        search_engine: 'v2'
      },
      headers: {
        'cache-control': 'no-cache',
        authorization: 'Bearer ' + config.USER_SEARCH_MGMT_TOKEN
      }
    };

    request(options, function (error, response, body) {
      if (error) {
        console.error(error);
        return deferred.reject(new Error(error));
      }
      var result = JSON.parse(body);
      if (result && result.length > 0) {
        var user = result[0];
        var userId = user.user_id;
        var options = {
          method: 'PATCH',
          url: 'https://' + config.TENANT_DOMAIN + '/api/v2/users/' + userId,
          headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + config.USER_UPDATE_MGMT_TOKEN
          },
          body: {app_metadata: {code: ''}},
          json: true
        };
        request(options, function (error /*, response, body */) {
          if (error) {
            console.error(error);
            return deferred.reject(new Error('Error cleaning down used code from user profile'));
          }
          console.log('Used code cleaned down from user profile');
          return deferred.resolve(user);
        });
      } else {
        console.error('No user found with matching code');
        return deferred.reject(new Error('No user found with matching code'));
      }
    });
    return deferred.promise;
  };
};

module.exports = verifyCode;
