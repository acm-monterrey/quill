var Settings = require('../models/Settings');

var SettingsController = {};

/**
 * Update any field in the settings.
 * @param  {String}   field    Name of the field
 * @param  {Any}      value    Value to replace it to
 * @param  {Function} callback args(err, settings)
 */
SettingsController.updateField = function(field, value, callback){
  var update = {};
  update[field] = value;
  Settings
    .findOneAndUpdate({},{
      $set: update
    }, {new: true}, callback);
};

/**
 * Update the list of whitelisted emails and email extensions.
 * @param  {[type]}   emails   [description]
 * @param  {Function} callback args(err, settings)
 */
SettingsController.updateWhitelistedEmails = function(emails, callback){
  Settings
    .findOneAndUpdate({},{
      $set: {
        whitelistedEmails: emails
      }
    }, {new: true})
    .select('whitelistedEmails')
    .exec(callback);
};

/**
 * Get the list of whitelisted emails.
 * Whitelist emails are by default not included in settings.
 * @param  {Function} callback args(err, emails)
 */
SettingsController.getWhitelistedEmails = function(callback){
  Settings.getWhitelistedEmails(callback);
};

/**
 * Set the time window for registrations.
 * If either open or close are null, do not change that time.
 * @param  {Number}   open     Open time in ms
 * @param  {Number}   close    Close time in ms
 * @param  {Function} callback args(err, settings)
 */
SettingsController.updateRegistrationTimes = function(open, close, callback){
  var updatedTimes = {};

  if (close <= open){
    return callback({
      message: "Registration cannot close before or at exactly the same time it opens."
    });
  }

  if (open){
    updatedTimes.timeOpen = open;
  }

  if (close){
    updatedTimes.timeClose = close;
  }

  Settings
    .findOneAndUpdate({},{
      $set: updatedTimes
    }, {new: true}, callback);
};

/**
 * Get the open and close time for registration.
 * @param  {Function} callback args(err, times : {timeOpen, timeClose})
 */
SettingsController.getRegistrationTimes = function(callback){
  Settings.getRegistrationTimes(callback);
};

/**
 * Get all public settings.
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
SettingsController.getPublicSettings = function(callback){
  Settings.getPublicSettings(callback);
};

/**
 * Adds the Setting's schema's newly added fields to the records
 * @param  {Function} callback [description]
 */

SettingsController.updateRecordsWithMissingFields = function(callback) {
  var settingSchema = Settings.schema.obj;

  Settings.update({},
    { $set: {
        checkInOpen: settingSchema.checkInOpen.default,
        teamSizeAccepted: settingSchema.teamSizeAccepted.default,
        hackLocation: settingSchema.hackLocation,
        maxTableCount: settingSchema.maxTableCount.default,
        currentTableCount: settingSchema.currentTableCount.default
    }}, { multi: true })
    .exec(callback);
}

module.exports = SettingsController;