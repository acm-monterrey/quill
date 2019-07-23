require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017";
var jwt             = require('jsonwebtoken');
var fs              = require('fs');

mongoose.connect(database);
var UserController  = require('../app/server/controllers/UserController');

var user = { email: process.env.ADMIN_EMAIL };
var fileName = 'accepted.txt';

if(fs.existsSync(fileName)) {
  var userArray = fs.readFileSync(fileName).toString().split('\n');
  var count = 0;

  userArray.forEach(function (id) {
    UserController.admitUser( id, user, function() {
      count += 1;
      if (count == userArray.length) {
        console.log("Done");
      }
    });
  });

} else if(process.env.ACCEPT_ALL) {
  var count = 0;

  UserController.getAll(function(err, users) {
    users.forEach( function(singleUser){
      UserController.admitUser(singleUser._id, singleUser, function() {
        count += 1;
        if (count == users.length) {
          console.log("Done");
        }
      })
    })
  });

}