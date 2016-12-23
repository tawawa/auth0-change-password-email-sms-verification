var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var metadata = require('./webtask.json');

const assert = require('assert');

var config = require('./config');
var init = false;
var createTicket, handleCode, verifyCode, sendMail, sendSms;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(function (req, res, next) {
  config.setVars(req);
  if (!init) {
    createTicket = require('./scripts/createTicket')(config);
    handleCode = require('./scripts/handleCode')(config);
    verifyCode = require('./scripts/verifyCode')(config);
    sendMail = require('./scripts/sendMail')(config);
    sendSms = require('./scripts/sendSms')(config);
    init = true;
  }
  next();
});

var errorPage = require('./resources/errorPage');
var forgotPage = require('./resources/forgotPage');
var codePage = require('./resources/codePage');

app.get('/forgot', function (req, res) {
  res.header("Content-Type", 'text/html');
  res.status(200).send(forgotPage);
});


app.post('/requestCode', function (req, res) {
  var username = req.body.username;
  var delivery = req.body.delivery;
  assert(username);
  assert(delivery);
  console.log('username: ' + username);
  console.log('delivery: ' + delivery);

  handleCode(username, delivery).then(function (newCode) {
    assert(newCode);
    console.log('code: ' + newCode);
    if (delivery === 'email') {
      sendMail(username, newCode).then(function () {
        // console.log('email sent...');
        res.header("Content-Type", 'text/html');
        res.status(200).send(codePage);
      }, function (err) {
        console.error(err);
        res.header("Content-Type", 'text/html');
        res.status(200).send(errorPage);
      });
    } else {
      sendSms(username, newCode).then(function () {
        // console.log('sms sent...');
        res.header("Content-Type", 'text/html');
        res.status(200).send(codePage);
      }, function (err) {
        console.error(err);
        res.header("Content-Type", 'text/html');
        res.status(200).send(errorPage);
      });
    }

  }, function (err) {
    console.error(err);
    res.header("Content-Type", 'text/html');
    res.status(200).send(errorPage);
  });

});

app.post('/sendCode', function (req, res) {
  var code = req.body.code;
  assert(code);
  // console.log(code);
  verifyCode(code).then(function (user) {
    // console.log(user);
    createTicket(user).then(function (ticket) {
      res.redirect(ticket);
    }, function (err) {
      console.error(err);
      res.header("Content-Type", 'text/html');
      res.status(200).send(errorPage);
    });

  }, function (err) {
    console.error(err);
    res.header("Content-Type", 'text/html');
    res.status(200).send(errorPage);
  });

});


// This endpoint would be called by webtask-gallery to dicover your metadata
app.get('/meta', function (req, res) {
  res.status(200).send(metadata);
});

module.exports = app;
