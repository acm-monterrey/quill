require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017";
var jwt             = require('jsonwebtoken');
mongoose.connect(database);

var User = require('../app/server/models/User');

var email = 'hacker1@school.edu';

User.findOne({
  email: email
}, function(err, user){
  if(user) {
    console.log(user.generateEmailVerificationToken());
    console.log(user.generateAuthToken());

    var temp = user.generateTempAuthToken();
    console.log(temp);

    console.log(jwt.verify(temp, process.env.JWT_SECRET));
  }
  else {
    console.log("No such user found");
  }
});
