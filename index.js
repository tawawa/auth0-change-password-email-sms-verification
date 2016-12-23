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


var errorPage = [
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
  '<title>Change Password</title>',
  '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"',
  'crossorigin="anonymous">',
  '<body>',
  '<div class="container">',
  '<h4>ERROR OCCURRED</h4>',
  '<br/>',
  'Error occurred processing your request, please see the webtask logs for details',
  '</div>',
  '</body>',
  '</html'
].join('\n');

var forgotPage = [
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
  '<title>Change Password</title>',
  '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"',
  'crossorigin="anonymous">',
  '<body>',
  '<div class="container">',
  '<h4>Reset Password For Account</h4>',
  '<br/>',
  '<form name="request-code" method="post" action="requestCode">',
  '<div class="form-group row">',
  '<label class="col-sm-2 col-form-label">Enter Username</label>',
  '<div class="col-sm-4">',
  '<input type="text" class="form-control" name="username" placeholder="email or mobile">',
  '</div>',
  '</div>',
  '<fieldset class="form-group row">',
  '<div class="col-sm-10">',
  '<div class="form-check">',
  '<label class="form-check-label">',
  '<input type="radio" class="form-check-input" name="delivery" value="email" checked>',
  'Email',
  '</label>',
  '</div>',
  '<div class="form-check">',
  '<label class="form-check-label">',
  '<input type="radio" class="form-check-input" name="delivery" value="mobile">',
  'Mobile',
  '</label>',
  '</div>',
  '</div>',
  '</fieldset>',
  '<button type="submit" class="btn btn-primary">Continue</button>',
  '</form>',
  '</div>',
  '</body>',
  '</html'
].join('\n');

var codePage = [
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
  '<title>Change Password</title>',
  '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"',
  'crossorigin="anonymous">',
  '<body>',
  '<div class="container">',
  '<h4>Reset Password For Account</h4>',
  '<br/>',
  '<p>A one time password has been sent via your selected channel',
  '<form name="send-code" method="post" action="sendCode">',
  '<div class="form-group row">',
  '<label class="col-sm-2 col-form-label">Enter code</label>',
  '<div class="col-sm-2">',
  '<input type="text" class="form-control" name="code" placeholder="6 digit code">',
  '</div>',
  '</div>',
  '<button type="submit" class="btn btn-primary">Continue</button>',
  '</form>',
  '</div>',
  '</body>',
  '</html'
].join('\n');


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
        res.status(500).send(errorPage);
      });
    } else {
      sendSms(username, newCode).then(function () {
        // console.log('sms sent...');
        res.header("Content-Type", 'text/html');
        res.status(200).send(codePage);
      }, function (err) {
        console.error(err);
        res.header("Content-Type", 'text/html');
        res.status(500).send(errorPage);
      });
    }

  }, function (err) {
    console.error(err);
    res.header("Content-Type", 'text/html');
    res.status(500).send(errorPage);
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
      res.status(500).send(errorPage);
    });

  }, function (err) {
    console.error(err);
    res.header("Content-Type", 'text/html');
    res.status(500).send(errorPage);
  });

});


// This endpoint would be called by webtask-gallery to dicover your metadata
app.get('/meta', function (req, res) {
  res.status(200).send(metadata);
});

module.exports = app;
