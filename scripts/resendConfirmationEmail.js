require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.REMOTE_URI;
// process.env.DATABASE || "mongodb://localhost:27017";

mongoose.connect(database);

var mailer = require('../app/server/services/email'),
    User = require('../app/server/models/User');

User.find({ 
  admin: false,
  'status.admitted': true, 
  'status.confirmed': false, 
  'status.declined': false 
}, 
  (err, users) => {
  if(err) return console.log(err);
  let ids = users.map(u => u._id);
  console.log('ids.length :', ids.length);
  console.log('ids :', ids);
  if(users  && users.length > 0){
    users.forEach( user => {
      console.log('user.email :', user.email);
      mailer.sendUserAdmitted(user.email)
    })
  } else {
    console.log("No users found")
  }

})

