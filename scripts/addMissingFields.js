require('dotenv').load({silent: true});

// Connect to mongodb
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017"
mongoose.connect(database);

var SettingsController = require('../app/server/controllers/SettingsController');
var UserController = require('../app/server/controllers/UserController');

SettingsController.updateRecordsWithMissingFields(function() {
    console.log('Updated settings to include missing fields');
})

UserController.updateRecordsWithMissingFields(function() {
    console.log('Updated user records to include missing fields');
});

