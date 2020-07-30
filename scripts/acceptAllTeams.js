require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017";
var jwt             = require('jsonwebtoken');
var fs              = require('fs');

mongoose.connect(database, {useFindAndModify: false});
var UserController  = require('../app/server/controllers/UserController');
var User = require('../app/server/models/User');
var mail = require('../app/server/services/email');
console.log('running');
User.aggregate([
  {
    $match: {
      'status.completedProfile': true,
      'status.admitted': false,
    },
  }, {
    $group: {
      _id: '$teamCode',
      count: {$sum: 1},
    }
  }, {
    $match: {
      count: 4,
    }
  }
], (err, data) => {
  if ( err ) {
    return console.error(err);
  }

  // console.log('data :>> ', data);
  const filtered = data.map(team => team._id);

  // console.log('filtered :>> ', filtered);
  User.find({teamCode: { $in: filtered}}, (err, users) => {
  // User.find({email: 'hello@hackmty.com'}, (err, users) => {
  // User.find({'status.admitted': true, 'status.confirmed': false}, (err, users) => {
    // console.log('users :>> ', users);
    console.log('users.length :>> ', users.length);
    admit(users)
    /* const p = users.map(user => {
      return new Promise((resolve, reject) => {
        UserController.admitUser(user._id, {email: 'admitionScript@hackmty.com'}, function() {
          resolve();
        })
      });
    })
    Promise.all(p)
      .then(()  => console.log('Sent!')) */
  })
})

async function admit(users) {
  let fullfilled = 0;
  let failed = 0;
  let count = 0;
  for(const user of users) {

    UserController.admitUser(user._id, {email: 'admitionScript@hackmty.com'}, function(err) {
      if(err) {
        failed++;
        if(fromEmailer) {
          fs.appendFile('failed2.txt', error.email + '\t' + error.error + '\n', (err) => {
            if(err) return console.error(err);
            fs.appendFile('resend2.txt', error.email + '\n', (err) => {
              if(err) return console.error(err);
            })
          })
        } else {
          console.log('err :>> ', err);
        }

      }
      fullfilled++;
      count++;
      if(count == users.length) {
        console.log('fullfilled :>> ', fullfilled);
        console.log('failed :>> ', failed);
      }
    })
  }
  
}
