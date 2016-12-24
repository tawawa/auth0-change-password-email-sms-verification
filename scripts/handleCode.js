'use strict';

var request = require("request");
var Q = require("q");
var async = require('async');
var createCode = require('./createCode');


var handleCode = function (config) {

  return function (username, delivery) {

    var deferred = Q.defer();
    async.waterfall([
      function (callback) {
        var searchCriteria;
        if (delivery === 'email') {
          searchCriteria = {
            q: 'email:' + username + ' AND identities.connection:"' + config.CONNECTION_NAME + '"',
            search_engine: 'v2'
          };
        } else {
          searchCriteria = {
            q: 'user_metadata.' + config.USER_METADATA_MOBILE_ATTR_NAME + ':"' + username + '" AND identities.connection:"' + config.CONNECTION_NAME + '"',
            search_engine: 'v2'
          };
        }
        console.log(searchCriteria);
        var options = {
          method: 'GET',
          url: 'https://' + config.TENANT_DOMAIN + '/api/v2/users',
          qs: searchCriteria,
          headers: {
            'cache-control': 'no-cache',
            authorization: 'Bearer ' + config.USER_SEARCH_MGMT_TOKEN
          }
        };
        request(options, function (error, response, body) {
          if (error) {
            console.error(error);
            callback(error);
          }
          var result = JSON.parse(body);
          if (result && result.length > 0) {
            var user = result[0];
            callback(null, user);
          } else {
            console.error('Error, user not found');
            callback('Error, user not found');
          }
        });
      },
      function (user, callback) {
        var userId = user.user_id;
        var newCode = createCode();
        console.log('code: ' + newCode);
        var options = {
          method: 'PATCH',
          url: 'https://' + config.TENANT_DOMAIN + '/api/v2/users/' + userId,
          headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + config.USER_UPDATE_MGMT_TOKEN
          },
          body: {app_metadata: {code: newCode}},
          json: true
        };
        request(options, function (error /*, response, body */) {
          if (error) {
            console.error(error);
            return callback(error);
          }
          callback(null, newCode);
        });
      }
    ], function (err, newCode) {
      if (err) {
        console.error(err);
        return deferred.reject(new Error(err));
      }
      return deferred.resolve(newCode);
    });
    return deferred.promise;
  };
};

module.exports = handleCode;
