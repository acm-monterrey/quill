var path = require('path');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var templatesDir = path.join(__dirname, '../templates');
var emailTemplates = require('email-templates');
const { RSA_NO_PADDING } = require('constants');

var ROOT_URL = process.env.ROOT_URL;

var EMAIL_HOST = process.env.EMAIL_HOST;
var EMAIL_USER = process.env.EMAIL_USER;
var EMAIL_PASS = process.env.EMAIL_PASS;
var EMAIL_PORT = process.env.EMAIL_PORT;
var EMAIL_CONTACT = process.env.EMAIL_CONTACT;
var EMAIL_HEADER_IMAGE = '/assets/images/favicon.png';
if(EMAIL_HEADER_IMAGE.indexOf("https") == -1){
  EMAIL_HEADER_IMAGE = ROOT_URL + EMAIL_HEADER_IMAGE;
}

var NODE_ENV = process.env.NODE_ENV;

var options = {
  // host: EMAIL_HOST,
  // port: EMAIL_PORT,
  // secure: true,
  service: 'Gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  }
};

console.log('options :>> ', options);

var transporter = nodemailer.createTransport(smtpTransport(options));

var controller = {};

controller.transporter = transporter;

function sendOne(templateName, options, data, callback){

  if (NODE_ENV === "dev") {
    console.log(templateName);
    console.log(JSON.stringify(data, "", 2));
  }

  emailTemplates(templatesDir, function(err, template){
    if (err) {
      return callback(err);
    }

    data.emailHeaderImage = EMAIL_HEADER_IMAGE;
    template(templateName, data, function(err, html, text){
      if (err) {
        return callback(err);
      }

      transporter.sendMail({
        from: EMAIL_CONTACT,
        to: options.to,
        subject: options.subject,
        html: html,
        text: text
      }, function(err, info){
        if(callback){
          callback(err, info);
        }
      });
    });
  });
}

/**
 * Send a verification email to a user, with a verification token to enter.
 * @param  {[type]}   email    [description]
 * @param  {[type]}   token    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
controller.sendVerificationEmail = function(email, token, callback) {

  var options = {
    to: email,
    subject: "[HACKMTY] - Verify your email"
  };

  var locals = {
    verifyUrl: ROOT_URL + '/verify/' + token
  };

  /**
   * Eamil-verify takes a few template values:
   * {
   *   verifyUrl: the url that the user must visit to verify their account
   * }
   */
  /*sendOne('email-verify', options, locals, function(err, info){
    if (err){
      console.log(err);
    }
    if (info){
      console.log(info.message);
    }
    if (callback){
      callback(err, info);
    }
  });*/

};

/**
 * Send a password recovery email.
 * @param  {[type]}   email    [description]
 * @param  {[type]}   token    [description]
 * @param  {Function} callback [description]
 */
controller.sendPasswordResetEmail = function(email, token, callback) {

  var options = {
    to: email,
    subject: "[HACKMTY] - Password reset requested!"
  };

  var locals = {
    title: 'Password Reset Request',
    subtitle: '',
    description: 'Somebody (hopefully you!) has requested that your password be reset. If ' +
      'this was not you, feel free to disregard this email. This link will expire in one hour.',
    actionUrl: ROOT_URL + '/reset/' + token,
    actionName: "Reset Password"
  };

  /**
   * Eamil-verify takes a few template values:
   * {
   *   verifyUrl: the url that the user must visit to verify their account
   * }
   */
  sendOne('email-link-action', options, locals, function(err, info){
    if (err){
      console.log("ERROR");
      console.log(err);
    }
    if (info){
      console.log('info :>> ', info);
      console.log(info.message);
    }
    if (callback){
      console.log("success");
      callback(err, info);
    }
  });

};

/**
 * Send a password recovery email.
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 */
controller.sendPasswordChangedEmail = function(email, callback){

  var options = {
    to: email,
    subject: "[HACKMTY] - Your password has been changed!"
  };

  var locals = {
    title: 'Password Updated',
    body: 'Somebody (hopefully you!) has successfully changed your password.',
  };

  /**
   * Eamil-verify takes a few template values:
   * {
   *   verifyUrl: the url that the user must visit to verify their account
   * }
   */
  sendOne('email-basic', options, locals, function(err, info){
    if (err){
      console.log(err);
    }
    if (info){
      console.log(info.message);
    }
    if (callback){
      callback(err, info);
    }
  });

};

/**
 *  Send mail when user is confirmed.
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
*/
controller.sendUserAdmitted = function(email){
  return new Promise((resolve, reject) => {
    var options = {
      to: email,
      subject: "[HackMTY Action Required] - HackMTY admittance!"
    };
  
    var locals = {
      title: 'Congratulations!',
      body: 'You have been admitted to HackMTY 2022. Please log in into your account and complete your profile information.',
    };
  
    /**
     * Eamil-verify takes a few template values:
     * {
     *   verifyUrl: the url that the user must visit to verify their account
     * }
     */
    sendOne('email-basic', options, locals, function(err, info){
      if (err){
        console.log("ERROR");
        
        reject({message: 'Error with email', showable: true, fromEmailer: true, email, error: err});
      }
      if (info){
        console.log("SUCCESS");
        
        resolve(info);
      }
  });
  });

};

controller.sendUserReminder = function(email){
  return new Promise((resolve, reject) => {
    var options = {
      to: email,
      subject: "[HackMTY Action Required] - Remind your team to confirm their spot!"
    };
  
    var locals = {
      title: 'Hello Hackers!',
      body: 'We have noticed that someone in your team has confirmed, but someone else has not done so. Please help us out by confirming your spot ahead of time to have a better hacking experience!',
    };
  
    /**
     * Eamil-verify takes a few template values:
     * {
     *   verifyUrl: the url that the user must visit to verify their account
     * }
     */
    sendOne('email-basic', options, locals, function(err, info){
      if (err){
        console.log("ERROR");
        
        reject({message: 'Error with email', showable: true, fromEmailer: true, email, error: err});
      }
      if (info){
        console.log("SUCCESS");
        
        resolve(info);
      }
  });
  });

};


module.exports = controller;
