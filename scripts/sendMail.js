'use strict';

var nodemailer = require('nodemailer');
var Q = require("q");

var sendMail = function (config) {

  console.log('@@@@@');
  console.log(config);
  console.log('@@@@@');

  var transporter = nodemailer.createTransport('smtps://' + config.SMTPS_EMAIL_USERNAME + ':' + config.SMTPS_EMAIL_PASSWORD + '@smtp.gmail.com');

  return function (mailTo, code) {

    var deferred = Q.defer();
    var mailOptions = {
      from: config.SMTPS_EMAIL_FROM,
      to: mailTo,
      subject: 'Password Change Request',
      text: 'Code: ' + code
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        return deferred.reject(new Error(error));
      }
      console.log('Message sent: ' + info.response);
      return deferred.resolve();
    });
    return deferred.promise;
  };
};

module.exports = sendMail;

