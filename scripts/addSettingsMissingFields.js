require('dotenv').load({silent: true});

// Connect to mongodb
var mongoose        = require('mongoose');
var database        = process.env.DATABASE || "mongodb://localhost:27017"
mongoose.connect(database);

var SettingsController = require('../app/server/controllers/SettingsController');

SettingsController.updateRecordsWithMissingFields(function() {
    console.log('Updated settings to include missing fields');
})
