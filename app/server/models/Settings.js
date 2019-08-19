var mongoose = require('mongoose');
var validator = require('validator');

/**
 * Settings Schema!
 *
 * Fields with select: false are not public.
 * These can be retrieved in controller methods.
 *
 * @type {mongoose}
 */
// Default location is Centro Estudiantil
var geolocation = {
  latitude: {
    type: Number,
    default: -100.28980135917662
  },
  longitude: {
    type: Number,
    default: 25.64875132580549
  }
};

var schema = new mongoose.Schema({
  status: String,
  timeOpen: {
    type: Number,
    default: 0
  },
  timeClose: {
    type: Number,
    default: Date.now() + 31104000000 // Add a year from now.
  },
  timeConfirm: {
    type: Number,
    default: 604800000 // Date of confirmation
  },
  whitelistedEmails: {
    type: [String],
    select: false,
    default: ['.mx'],
  },
  waitlistText: {
    type: String
  },
  acceptanceText: {
    type: String,
  },
  confirmationText: {
    type: String
  },
  checkInOpen: {
    type: Number,
    default: Date.now() + 31104000000 
  },
  teamSizeAccepted: {
    type: Number,
    default: 4
  },
  hackLocation: geolocation,
  maxTableCount: {
    type: Number,
    default: 100
  },
  currentTableCount: {
    type: Number,
    default: 0
  }
});

/**
 * Get the list of whitelisted emails.
 * Whitelist emails are by default not included in settings.
 * @param  {Function} callback args(err, emails)
 */
schema.statics.getWhitelistedEmails = function(callback){
  this
    .findOne({})
    .select('whitelistedEmails')
    .exec(function(err, settings){
      return callback(err, settings.whitelistedEmails);
    });
};

/**
 * Get the open and close time for registration.
 * @param  {Function} callback args(err, times : {timeOpen, timeClose, timeConfirm})
 */
schema.statics.getRegistrationTimes = function(callback){
  this
    .findOne({})
    .select('timeOpen timeClose timeConfirm')
    .exec(function(err, settings){
      callback(err, {
        timeOpen: settings.timeOpen,
        timeClose: settings.timeClose,
        timeConfirm: settings.timeConfirm
      });
    });
};

/**
 * Gets the last assigned table number.
 * @param  {Function} callback [description]
 */
schema.statics.getCurrentTableCount = function(callback){
  this
   .findOne({})
   .select({'currentTableCount': 1})
   .exec(callback);
};

schema.statics.getAllSettings = function(callback){
  this
    .findOne({})
    .exec(callback);
}

schema.statics.getPublicSettings = function(callback){
  this
    .findOne({}).select('-hackLocation -maxTableCount')
    .exec(callback);
};

module.exports = mongoose.model('Settings', schema);
