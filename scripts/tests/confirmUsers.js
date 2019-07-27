/**
 *      Script that confirms the status of every registered user. 
 *  WARNING: Should only be run during development testing.
 */
require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017";

mongoose.connect(database);

var SettingsController = require('../../app/server/controllers/SettingsController');
var UserController  = require('../../app/server/controllers/UserController');

var confirmation = {
    phoneNumber: '12345678',
    dietaryRestrictions: [],
    shirtSize: 'M',
    wantsHardware: false,
    major: 'CS'
};

// Makes sure that we aren't in production
if(process.env.NODE_ENV === 'dev') {
    
    //  Update the confirmation time to avoid missing the deadline
    var nextMonth = Date.now() + 2628000000

    SettingsController.updateField('timeConfirm', nextMonth, function(err, _) {
        if(err) {
            console.log(err);
            return;
        }

        UserController.getAll(function(err, users) {
            if(users) {
                let counter = 0;
                users.forEach(record => {
                    let userId = record._id;
                    UserController.updateConfirmationById(userId, confirmation, function(err, user){
                        if(err) {
                            console.log(err);
                            return;
                        }
                        counter++;
                        if(counter === users.length) {
                            console.log('@@ All users successfully confirmed');
                        }
                    });
                });
            }
        });
    });
    
}