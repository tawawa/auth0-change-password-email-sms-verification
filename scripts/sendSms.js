'use strict';

var Q = require("q");

var sendSms = function (config) {

  var client = require('twilio')(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  return function (mobile, code) {
    var deferred = Q.defer();
    client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      to: mobile,
      body: "code: " + code
    }, function (err /*, message */) {
      if (err) {
        console.error(err);
        return deferred.reject(new Error(err));
      }
      return deferred.resolve();
    });
    return deferred.promise;
  };
};

module.exports = sendSms;

