require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || 'mongodb://localhost:3000:27017/hackmty';
var fs = require('fs');
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
  let fullfilled = 0;
  let failed = 0;
  let emails = users.map(user => user.email);
  // let emails = fs.readFileSync('resend.txt').toString().split('\n')
  // console.log('emails :>> ', emails);
  if(emails  && emails.length > 0){
    resend(emails)
    /* let p = users.map( user => {
      return new Promise((resolve, reject) => {
        console.log('user.email :', user.email);
        mailer.sendUserAdmitted(user.email)
        .then(success => {
          fullfilled++;
          resolve()
        })
        .catch(error => {
          failed++;
          fs.appendFile('failed2.txt', error.email + '\t' + error.error + '\n', (err) => {
            if(err) return reject(err);
            fs.appendFile('resend2.txt', error.email + '\n', (err) => {
              if(err) return reject(err);
              resolve();
            })
          })

        })
      });
    });
    Promise.all(p)
    .then(success => {
      console.log('fullfilled :>> ', fullfilled);
      console.log('failed :>> ', failed);
    })
    .catch(err => console.error(err)) */
  } else {
    console.log("No users found")
  }

})

async function resend(emails) {
  console.log('emails :>> ', emails);
  let fullfilled = 0;
  let failed = 0;
  for(const email of emails) {
    try {
      await mailer.sendUserAdmitted(email);
      fullfilled++;
    } catch(error) {
      console.log('error :>> ', error);
      failed++;
      fs.appendFile('failed.txt', error.email + '\t' + error.error + '\n', (err) => {
        if(err) return console.error(err);
        fs.appendFile('resend.txt', error.email + '\n', (err) => {
          if(err) return console.error(err);
        })
      })
    }
  }
  
  console.log('fullfilled :>> ', fullfilled);
  console.log('failed :>> ', failed);
}