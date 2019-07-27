/**
 *      Script that creates one random team
 *  WARNING: Should only be run during development testing.
 */
require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017";

mongoose.connect(database);

var UserController  = require('../../app/server/controllers/UserController');

if(process.env.NODE_ENV === 'dev') {

    UserController.getAll(function(err, users) {
        let teamName = 'CoolHackTeam';
        let teamSize = 0;

        // Start at position 1 so we skip the admin 
        // Double condition to avoid out of range errors
        for(let i = 1 ; i <= process.env.TEAM_MAX_SIZE && i < users.length ; i++) {
            let user = users[i];
            UserController.createOrJoinTeam(user._id, teamName, function(err, _) {
                if(err) {
                    console.log(err);
                    return;
                }
                teamSize++;
                if(teamSize == process.env.TEAM_MAX_SIZE) {
                    console.log('@@ Team created successfully.');
                }
            });
        }
    });
}