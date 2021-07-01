require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || 'mongodb://localhost:3000:27017/hackmty';
var fs = require('fs');

mongoose.connect(database);

var mailer = require('../app/server/services/email'),
    User = require('../app/server/models/User');


User.aggregate([
  { 
    $match: {
      'status.confirmed': false, 
      'status.admitted': true, 
      'status.declined': false, 
      admin: false
    }
  }, {
    $group: {
      _id: '$teamCode',
    }
  }], (err, teams) => {
    if(err) return console.error(err);
    console.log('teams.length :>> ', teams.length);
    console.log('teams :>> ', teams);
    const filtered = teams.map(team => team._id);
    User.find({teamCode: { $in: filtered}}, (err, users) => {
      if(err) return console.log('err :', err);
      console.log('users.length :', users.length);
      console.log('users[0] :', users[0]);

      // let emails = users.map(user => user.email)
      let emails = fs.readFileSync('resend.txt').toString().split('\n')
      if(emails && emails.length > 0) {
        resend(emails);
      } else {
        console.log("No users found");
      }
    
    })  
  })

    


    async function resend(emails) {
      console.log('emails :>> ', emails);
      let fullfilled = 0;
      let failed = 0;
      for(const email of emails) {
        try {
          await mailer.sendUserReminder(email);
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