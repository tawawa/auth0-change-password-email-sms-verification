'use strict';

var request = require("request");
var Q = require("q");


var createTicket = function (config) {
  return function (user) {
    var deferred = Q.defer();
    var options = {
      method: 'POST',
      url: 'https://' + config.TENANT_DOMAIN + '/api/v2/tickets/password-change',
      headers: {
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + config.PASSWORD_CHANGE_MGMT_TOKEN
      },
      body: {
        // result_url: 'http://xxxxxxx/done',
        connection_id: config.CONNECTION_ID,
        email: user.email,
        ttl_sec: 0
      },
      json: true
    };
    request(options, function (error, response, body) {
      if (error) {
        console.error(error);
        return deferred.reject(new Error(error));
      }
      return deferred.resolve(body.ticket);
    });
    return deferred.promise;
  };
};

module.exports = createTicket;
