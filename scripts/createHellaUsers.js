require('dotenv').load({silent: true});

// Connect to mongodb
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017"
mongoose.connect(database);
var UserController = require('../app/server/controllers/UserController');

var users = 100;
var username = 'hacker';
var p = [];
for (var i = 0; i < users; i++){
  p.push(new Promise((resolve,reject)=> {
    console.log(username, i);
    UserController
      .createUser(username + i + '@school.edu', 'foobar', function(error, userData){
        if(error) reject(error);
        resolve("Successfully created: "+ i);
      });
  }))
}

Promise.all(p)
.then( users => console.log(users.length + ' created'))
.catch( error => console.error(error))