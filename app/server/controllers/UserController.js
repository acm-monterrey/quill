var _ = require('underscore');
var User = require('../models/User');
var Settings = require('../models/Settings');
var Mailer = require('../services/email');
var Stats = require('../services/stats');
var SettingsController = require('../controllers/SettingsController');

var validator = require('validator');
var moment = require('moment');
var turfdistance = require('@turf/distance');
var point = require('turf-point');

var UserController = {};

var maxTeamSize = process.env.TEAM_MAX_SIZE || 4;


// Tests a string if it ends with target s
function endsWith(s, test){
  return test.indexOf(s, test.length - s.length) !== -1;
}

/**
 * Determine whether or not a user can register.
 * @param  {String}   email    Email of the user
 * @param  {Function} callback args(err, true, false)
 * @return {[type]}            [description]
 */
function canRegister(email, password, callback){

  if (!password || password.length < 6){
    return callback({ showable: true, message: "Password must be 6 or more characters."}, false);
  }

  // Check if its within the registration window.
  Settings.getRegistrationTimes(function(err, times){
    if (err) {
      callback(err);
    }

    var now = Date.now();

    if (now < times.timeOpen){
      return callback({
        showable: true,
        message: "Registration opens in " + moment(times.timeOpen).fromNow() + "!"
      });
    }

    if (now > times.timeClose){
      return callback({
        showable: true,
        message: "Sorry, registration is closed."
      });
    }

    // Check for emails.
    Settings.getWhitelistedEmails(function(err, emails){
      if (err || !emails){
        return callback(err);
      }
      for (var i = 0; i < emails.length; i++) {
        if (validator.isEmail(email)){
          return callback(null, true);
        }
      }
      return callback({
        showable: true,
        message: "Not a valid educational email."
      }, false);
    });

  });
}

/**
 * Performs the needed operations to calculate the distance between
 * the user's location and the hack's location. 
 * @param {Array}  pointA  longitude and latitude of the hack
 * @param {Array}  pointb  longitude and latitude of the user
 * @return {int}    dist   Distance between the two points in meters
 */
function getDistanceInMetersFromHack(pointA, pointB) {
  var from = point(pointA);
  var to = point(pointB);
  var options = { units: 'kilometers'};
  var distance = turfdistance.default(from, to, options);
  distance = distance * 1000;
  return distance;
}

/**
 * Login a user given a token
 * @param  {String}   token    auth token
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithToken = function(token, callback){
  User.getByToken(token, function(err, user){
    return callback(err, token, user);
  });
};

/**
 * Login a user given an email and password.
 * @param  {String}   email    Email address
 * @param  {String}   password Password
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithPassword = function(email, password, callback){

  if (!password || password.length === 0){
    return callback({
      showable: true,
      message: 'Please enter a password'
    });
  }

  if (!validator.isEmail(email)){
    return callback({
      showable: true,
      message: 'Invalid email'
    });
  }

  User
    .findOneByEmail(email)
    .select('+password')
    .exec(function(err, user){
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback({
          showable: true,
          message: "We couldn't find you!"
        });
      }
      if (!user.checkPassword(password)) {
        return callback({
          showable: true,
          message: "That's not the right password."
        });
      }

      // yo dope nice login here's a token for your troubles
      var token = user.generateAuthToken();

      var u = user.toJSON();

      delete u.password;

      return callback(null, token, u);
  });
};

/**
 * Create a new user given an email and a password.
 * @param  {String}   email    User's email.
 * @param  {String}   password [description]
 * @param  {Function} callback args(err, user)
 */
UserController.createUser = function(email, password, callback) {

  if (typeof email !== "string"){
    return callback({
      showable: true,
      message: "Email must be a string."
    });
  }

  email = email.toLowerCase();

  // Check that there isn't a user with this email already.
  canRegister(email, password, function(err, valid){

    if (err || !valid){
      return callback(err);
    }

    User
      .findOneByEmail(email)
      .exec(function(err, user){

        if (err) {
          return callback(err);
        }

        if (user) {
          return callback({
            showable: true,
            message: 'An account for this email already exists.'
          });
        } else {

          // Make a new user
          var u = new User();
          u.email = email;
          u.password = User.generateHash(password);
          u.save(function(err){
            if (err){
              return callback(err);
            } else {
              // yay! success.
              var token = u.generateAuthToken();

              // Send over a verification email
              var verificationToken = u.generateEmailVerificationToken();
              Mailer.sendVerificationEmail(email, verificationToken);

              return callback(
                null,
                {
                  token: token,
                  user: u
                }
              );
            }

          });

        }

    });
  });
};

UserController.getByToken = function (token, callback) {
  User.getByToken(token, callback);
};

/**
 * Get all users.
 * It's going to be a lot of data, so make sure you want to do this.
 * @param  {Function} callback args(err, user)
 */
UserController.getAll = function (callback) {
  User.find({}, callback);
};

/**
 * Get a page of users.
 * @param  {[type]}   page     page number
 * @param  {[type]}   size     size of the page
 * @param  {Function} callback args(err, {users, page, totalPages})
 */
UserController.getPage = function(query, callback){
  var page = query.page;
  var size = parseInt(query.size);
  var searchText = query.text;

  var findQuery = {};
  if (searchText.length > 0){
    var queries = [];
    var re = new RegExp(searchText, 'i');
    queries.push({ email: re });
    queries.push({ 'profile.name': re });
    queries.push({ 'teamCode': re });
    queries.push({ 'profile.school': re });
    queries.push({ 'status.tableNumber': re})

    findQuery.$or = queries;
  }

  User
    .find(findQuery)
    .sort({
      'teamCode': 'desc'
    })
    .select('+status.admittedBy')
    .skip(page * size)
    .limit(size)
    .exec(function (err, users){
      if (err || !users){
        return callback(err);
      }

      User.count(findQuery).exec(function(err, count){

        if (err){
          return callback(err);
        }

        return callback(null, {
          users: users,
          page: page,
          size: size,
          totalPages: Math.ceil(count / size)
        });
      });

    });
};

/**
 * Get a user by id.
 * @param  {String}   id       User id
 * @param  {Function} callback args(err, user)
 */
UserController.getById = function (id, callback){
  User.findById(id, callback);
};

/**
 * Update a user's profile object, given an id and a profile.
 *
 * @param  {String}   id       Id of the user
 * @param  {Object}   profile  Profile object
 * @param  {Function} callback Callback with args (err, user)
 */
UserController.updateProfileById = function (id, profile, callback){

  // Validate the user profile, and mark the user as profile completed
  // when successful.
  User.validateProfile(profile, function(err){
    if (err){
      return callback({showable: true, message: 'invalid profile'});
    }

    // Check if its within the registration window.
    Settings.getRegistrationTimes(function(err, times){
      if (err) {
        return callback(err);
      }

      var now = Date.now();

      if (now < times.timeOpen){
        return callback({
          showable: true,
          message: "Registration opens " + moment(times.timeOpen).fromNow() + "!"
        });
      }

      if (now > times.timeClose){
        return callback({
          showable: true,
          message: "Sorry, registration is closed."
        });
      }
    });

    User.findOneAndUpdate({
      _id: id,
      verified: true
    },
      {
        $set: {
          'lastUpdated': Date.now(),
          'profile': profile,
          'status.completedProfile': true
        }
      },
      {
        new: true
      },
      callback);

  });
};

/**
 * Update a user's confirmation object, given an id and a confirmation.
 *
 * @param  {String}   id            Id of the user
 * @param  {Object}   confirmation  Confirmation object
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.updateConfirmationById = function (id, confirmation, callback){

  Settings.getRegistrationTimes(function(err, times){
    if(err){
      return callback(err)
    }

    User.findById(id, function(err, user){
      if(err || !user){
        return callback(err);
      }
  
      // Make sure that the user followed the deadline, but if they're already confirmed
      // that's okay.
      if (Date.now() >= times.timeConfirm && !user.status.confirmed){
        return callback({
          showable: true,
          message: "You've missed the confirmation deadline."
        });
      }
  
      // You can only confirm acceptance if you're admitted and haven't declined.
      User.findOneAndUpdate({
        '_id': id,
        'verified': true,
        'status.admitted': true,
        'status.declined': {$ne: true}
      },
        {
          $set: {
            'lastUpdated': Date.now(),
            'confirmation': confirmation,
            'status.confirmed': true,
          }
        }, {
          new: true
        },
        callback);
    });
  })
};

/**
 * Decline an acceptance, given an id.
 *
 * @param  {String}   id            Id of the user
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.declineById = function (id, callback){

  // You can only decline if you've been accepted.
  User.findOneAndUpdate({
    '_id': id,
    'verified': true,
    'status.admitted': true,
    'status.declined': false
  },
    {
      $set: {
        'lastUpdated': Date.now(),
        'status.confirmed': false,
        'status.declined': true
      }
    }, {
      new: true
    },
    callback);
};

/**
 * Verify a user's email based on an email verification token.
 * @param  {[type]}   token    token
 * @param  {Function} callback args(err, user)
 */
UserController.verifyByToken = function(token, callback){
  User.verifyEmailVerificationToken(token, function(err, email){
    User.findOneAndUpdate({
      email: new RegExp('^' + email + '$', 'i')
    },{
      $set: {
        'verified': true
      }
    }, {
      new: true
    },
    callback);
  });
};

/**
 * Get a specific user's teammates. NAMES ONLY.
 * @param  {String}   id       id of the user we're looking for.
 * @param  {Function} callback args(err, users)
 */
UserController.getTeammates = function(id, callback){
  User.findById(id, function(err, user){
    if (err || !user){
      return callback(err, user);
    }

    var code = user.teamCode;

    if (!code){
      return callback({
        showable: true,
        message: "You're not on a team."
      });
    }

    User
      .find({
        teamCode: code
      })
      .select('profile.name status.checkedIn')
      .exec((err, teammates) => {
        if(err) return callback(err, teammates);
        let numberCheckedIn = 0;
        teammates.forEach(function(member) {
          if(member.status.checkedIn) numberCheckedIn++;
        });
        
        Settings.getPublicSettings(function(err, settings){
          if(err) return callback(err, settings);

          let canBeAssigned = numberCheckedIn >= settings.teamSizeAccepted;
          return callback(null, { assign: canBeAssigned, teammates: teammates });
        });
      });
    });
};

/**
 * Given a team code and id, join a team.
 * @param  {String}   id       Id of the user joining/creating
 * @param  {String}   code     Code of the proposed team
 * @param  {Function} callback args(err, users)
 */
UserController.createOrJoinTeam = function(id, code, callback){

  if (!code){
    return callback({
      showable: true,
      message: "Please enter a team name."
    });
  }

  if (typeof code !== 'string') {
    return callback({
      showable: true,
      message: "Get outta here, punk!"
    });
  }

  User.find({
    teamCode: code
  })
  .select('profile.name leader') // Include 'leader' field in the query
  .exec(function(err, users){
    // Check to see if this team is joinable (< team max size)
    if (users.length >= maxTeamSize){
      return callback({
        showable: true,
        message: "Team is full."
      });
    }

    let isLeader = false;

    // Check if any existing user in the team is a leader
    for (const user of users) {
      if (user.leader) {
        isLeader = true;
        break;
      }
    }

    // If there's no existing leader, set the new user as the leader.
    const updateOptions = {
      teamCode: code,
      verified: true
    };
    
    if (!isLeader) {
      updateOptions.leader = true;
    }

    User.findOneAndUpdate(
      { _id: id, verified: true },
      { $set: updateOptions },
      { new: true },
      callback
    );
  });
};

/**
 * Given a team code and email, add a teammate to a team.
 * @param  {String}   email       Id of the user joining/creating
 * @param  {String}   code     Code of the proposed team
 * @param  {Function} callback args(err, users)
 */
UserController.addTeammate = function(email, code, callback){


  if (!code || !email){
    return callback({
      showable: true,
      message: "Please enter an email."
    });
  }


  if (typeof code !== 'string' || typeof email !== 'string') {
    return callback({
      showable: true,
      message: "Get outta here, punk!"
    });
  }

  User.find({
    email: email
  })
  .select('profile.name email teamCode')
  .exec(function(err, users){
    if(users.length === 0){
      return callback({
        showable: true,
        message: "This email is not registered on the site."
      });
    }
    else {
      User.find({
        teamCode: code
      })
      .select('profile.name email teamCode')
      .exec(function(err, users){
        
        // Check to see if this team is joinable (< team max size)
        if (users.length >= maxTeamSize){
          return callback({
            showable: true,
            message: "Team is full."
          });
        }
    
        for (const user of users) {
          if (user.email == email && user.teamCode) {
            return callback({
              showable: true,
              message: "This user is already on a team"
            });
          }
        }
    
        // Otherwise, we can add that person to the team.
        User.findOneAndUpdate({
          email: email,
          verified: true,
          teamCode: null
        },{
          $set: {
            teamCode: code
          }
        }, {
          new: true
        },
        callback);
    
      });
    }
  });
};

/**
 * Given an id, remove them from any teams.
 * @param  {[type]}   id       Id of the user leaving
 * @param  {Function} callback args(err, user)
 */
UserController.leaveTeam = function(id, callback){
  User.findOneAndUpdate({
    _id: id
  },{
    $set: {
      teamCode: null,
      leader: false
    }
  }, {
    new: true
  },
  callback);
};

/**
 * Resend an email verification email given a user id.
 */
UserController.sendVerificationEmailById = function(id, callback){
  User.findOne(
    {
      _id: id,
      verified: false
    },
    function(err, user){
      if (err || !user){
        return callback(err);
      }
      var token = user.generateEmailVerificationToken();
      Mailer.sendVerificationEmail(user.email, token);
      return callback(err, user);
  });
};

/**
 * Password reset email
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
UserController.sendPasswordResetEmail = function(email, callback){
  User
    .findOneByEmail(email)
    .exec(function(err, user){
      if (err || !user){
        return callback(err);
      }

      var token = user.generateTempAuthToken();
      Mailer.sendPasswordResetEmail(email, token, callback);
    });
};

/**
 * UNUSED
 *
 * Change a user's password, given their old password.
 * @param  {[type]}   id          User id
 * @param  {[type]}   oldPassword old password
 * @param  {[type]}   newPassword new password
 * @param  {Function} callback    args(err, user)
 */
UserController.changePassword = function(id, oldPassword, newPassword, callback){
  if (!id || !oldPassword || !newPassword){
    return callback({
      showable: true,
      message: 'Bad arguments.'
    });
  }

  User
    .findById(id)
    .select('password')
    .exec(function(err, user){
      if (user.checkPassword(oldPassword)) {
        User.findOneAndUpdate({
          _id: id
        },{
          $set: {
            password: User.generateHash(newPassword)
          }
        }, {
          new: true
        },
        callback);
      } else {
        return callback({
          showable: true,
          message: 'Incorrect password'
        });
      }
    });
};

/**
 * Reset a user's password to a given password, given a authentication token.
 * @param  {String}   token       Authentication token
 * @param  {String}   password    New Password
 * @param  {Function} callback    args(err, user)
 */
UserController.resetPassword = function(token, password, callback){
  if (!password || !token){
    return callback({
      showable: true,
      message: 'Bad arguments'
    });
  }

  if (password.length < 6){
    return callback({
      showable: true,
      message: 'Password must be 6 or more characters.'
    });
  }

  User.verifyTempAuthToken(token, function(err, id){

    if(err || !id){
      return callback(err);
    }

    User
      .findOneAndUpdate({
        _id: id
      },{
        $set: {
          password: User.generateHash(password)
        }
      }, function(err, user){
        if (err || !user){
          return callback(err);
        }

        Mailer.sendPasswordChangedEmail(user.email);
        return callback(null, {
          message: 'Password successfully reset!'
        });
      });
  });
};

/**
 * Logic for checking if the user's current location matches the hacks
 * location so that the user can checkin
 * @param {Function} callback [description]
 */
UserController.checkInByCurrentLocation = function(id, coordinates, callback) {
  Settings.getAllSettings(function(err, settings) {
    if(err) return callback(err);

    if (!settings.checkInActive) {
      callback({showable: true, message: 'Check-in is not active at this moment.'})
    }
    var hackLocation = [ settings.hackLocation.longitude, settings.hackLocation.latitude ];
    var userLocation = [ coordinates.longitude, coordinates.latitude ];
    var distance = getDistanceInMetersFromHack(hackLocation, userLocation);
    console.log('distance :', distance);
    if(distance <= 35) {
      User.findOneAndUpdate({
        _id: id,
        verified: true
      },{
        $set: {
          'status.checkedIn': true,
          'status.checkInTime': Date.now()
        }
      }, { new: true }, callback);
    }  else {
      callback({showable: true, message: "User is not within check-in range."});
    }
  });
}

/**
 * Adds the schema's newly added fields to the records that do not contain it
 * @param  {Function} callback [description]
 */
UserController.updateRecordsWithMissingFields = function(callback) {
  var userSchema = User.schema.obj;

  User.update({ 'status.tableNumber': {$exists: false} },
    { $set: {
      'status.tableNumber': userSchema.status.tableNumber.default,
    }}, { multi: true })
    .exec(callback);
}

/**
 * Assigns the next available table to a team
 * @param {[type]} id             User id
 * @param {[Function]} callback  
 */
UserController.assignNextAvailableTable = function(id, callback) {
  Settings.getAllSettings(function(err, settings) {
    if(err) return callback(err, data);

    if (!settings.checkInActive) {
      callback({showable: true, message: 'Check-in is not active at this moment.'})
    }

    this.getTeammates(id, function(err, data){
      if(err) return callback(err, data);
      
      var teammates = data.teammates;
      let ids = [];
      let bAssigned = false;
      teammates.forEach(function(team){
        if(team.status.tableNumber !== "Not assigned") bAssigned = true;
        ids.push(team._id);
      });
      // Check if team already has table
      if(bAssigned) return callback({showable:true, message: "El equipo ya tiene mesa asignada"})

      Settings.getCurrentTableCount(function(err, tableNumber){
        if(err) return callback(err, tableNumber);
        let currentCount = tableNumber.currentTableCount + 1;
        currentCount = currentCount.toString();
        User.find({
          "status.tableNumber": currentCount
        },
        (err, alreadyAssignedUsers) => {
          if(err) return callback(err);
          // Checks if another team doesnt already have that table, to prevent 2 or more teams in the same table
          if(alreadyAssignedUsers.length > 0) return callback({ showable: true, message: "There was an error. Try Again"})

          SettingsController.updateField('currentTableCount', currentCount, function( err, _){
            if(err) return callback(err);
    
            User
            .updateMany(
              { _id: { $in: ids } },
              {$set: { 'status.tableNumber': currentCount }},
              (err,update) => {
                if(err) return callback(err, null);
    
                User
                  .findById(id)
                  .select('profile.name status.checkedIn status.tableNumber')
                  .exec(callback);
            });
          });
        });
      });
    });
  });
}

/**
 * [ADMIN ONLY]
 * 
 * Sets a specific table number for a team if it is available
 * @param {String} teamCode
 * @param {Number} tableNumber 
 * @param {function} callback 
 */
UserController.assignSpecificTableNumber = function(teamCode, tableNumber, callback) {
  // First validate number
  if(isNaN(tableNumber)) {
    return callback({
      showable: true,
      message: 'Table number is not a valid number'
    })
  }
  // Then check if any other team has this table number.
  User
      .find({
        'status.tableNumber': tableNumber,
        teamCode: {$ne: teamCode}
      }, (err, existingTableUsers) => {
        if(err) return callback(err);
        if(existingTableUsers.length > 0) {
          return callback({
            showable: true,
            message: 'Table number is being used by team "' + existingTableUsers[0].teamCode + '"'
          });
        }
        // Finally update team with new table number
        User.updateMany({teamCode: teamCode}, 
          {
            'status.tableNumber': tableNumber
          })
          .exec(callback);
      });
} 

/**
 * [ADMIN ONLY]
 *
 * Admit a user.
 * @param  {String}   userId   User id of the admit
 * @param  {String}   user     User doing the admitting
 * @param  {Function} callback args(err, user)
 */
UserController.admitUser = function(id, user, callback){
  Settings.getRegistrationTimes(function(err, times){
    User
      .findOneAndUpdate({
        _id: id,
        verified: true
      },{
        $set: {
          'status.admitted': true,
          'status.admittedBy': user.email,
          'status.confirmBy': times.timeConfirm
        }
      }, {
        new: true
      },
      function(err, user) {
        if(err) callback(err)
        Mailer.sendUserAdmitted(user.email)
        .then(success => callback(null, user))
        .catch(error => callback(error))
      });
  });
  User.findById({_id: id}, function(err, user){
    // console.log(user);
  });
};

/**
 * [ADMIN ONLY]
 *
 * Check in a user.
 * @param  {String}   userId   User id of the user getting checked in.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
UserController.checkInById = function(id, user, callback){
  Settings.getAllSettings(function(err, settings) {
    if(err) return callback(err, data);

    if (!settings.checkInActive) {
      callback({showable: true, message: 'Check-in is not active at this moment.'})
    }
    User.findOneAndUpdate({
      _id: id,
      verified: true
    },{
      $set: {
        'status.checkedIn': true,
        'status.checkInTime': Date.now()
      }
    }, {
      new: true
    },
    callback);
  });
};

/**
 * [ADMIN ONLY]
 *
 * Check out a user.
 * @param  {String}   userId   User id of the user getting checked out.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
UserController.checkOutById = function(id, user, callback){
  Settings.getAllSettings(function(err, settings) {
    if(err) return callback(err, data);

    if (!settings.checkInActive) {
      callback({showable: true, message: 'Check-in is not active at this moment.'})
    }
    User.findOneAndUpdate({
      _id: id,
      verified: true
    },{
      $set: {
        'status.checkedIn': false
      }
    }, {
      new: true
    },
    callback);
  });
};


/**
 * [ADMIN ONLY]
 */

UserController.getStats = function(callback){
  return callback(null, Stats.getUserStats());
};

UserController.updateConfirmBy = function(timeConfirm, callback){
  User.updateMany({
    verified:true,
    'status.admitted': true
  },
  {
    'status.confirmBy':timeConfirm
  },
  callback);
}
module.exports = UserController;
