require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017";
var jwt             = require('jsonwebtoken');
var fs              = require('fs');

mongoose.connect(database);
var UserController  = require('../app/server/controllers/UserController');
var User = require('../app/server/models/User');

console.log('running');
User.aggregate([
  {
    $match: {
      'status.completedProfile': true,
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

  console.log('data :>> ', data);
  const filtered = data.map(team => team._id);

  console.log('filtered :>> ', filtered);
  User.find({teamCode: { $in: filtered}}, (err, users) => {
    console.log('users :>> ', users);
    console.log('users.length :>> ', users.length);
  })
})
