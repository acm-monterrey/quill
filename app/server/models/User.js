var mongoose   = require('mongoose'),
    bcrypt     = require('bcrypt-nodejs'),
    validator  = require('validator'),
    jwt        = require('jsonwebtoken');
    JWT_SECRET = process.env.JWT_SECRET;

var profile = {

  // Basic info
  name: {
    type: String,
    min: 1,
    max: 100,
  },

  discordUsername: {
    type: String,
    min: 1,
    max: 50,
  },

  adult: {
    type: Boolean,
    required: true,
    default: true,
  },

  school: {
    type: String,
    min: 1,
    max: 150,
  },

  graduationYear: {
    type: String,
    enum: {
      values: '2020 2021 2022 2023 2024 2025'.split(' '),
    }
  },

  firstHack: {
    type: Boolean,
    required: true,
  default:false,
  },

  description: {
    type: String,
    min: 0,
    max: 300
  },

  essay: {
    type: String,
    min: 0,
    max: 1500
  },

  degree: {
    type: String,
    require: true,
    enum: {
      values: ['HS', "U", "G"],
    }
  },

  // Optional info for demographics
  gender: {
    type: String,
    enum : {
      values: 'M F O N'.split(' ')
    }
  },

  cv: {
    type: String,
  }

};

// Only after confirmed
var confirmation = {
  phoneNumber: String,
  dietaryRestrictions: [String],
  shirtSize: {
    type: String,
    enum: {
      values: 'XS S M L XL XXL'.split(' ')
    }
  },
  wantsHardware: Boolean,
  hardware: String,

  major: String,
  github: String,
  twitter: String,
  website: String,
  resume: String,

  needsReimbursement: Boolean,
  address: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  receipt: String,

  hostNeededFri: Boolean,
  hostNeededSat: Boolean,
  genderNeutral: Boolean,
  catFriendly: Boolean,
  smokingFriendly: Boolean,
  hostNotes: String,

  notes: String,

  signatureLiability: String,
  signaturePhotoRelease: String,
  signatureCodeOfConduct: String,
  signatureMLH: String,
  signatureDSP: String,
};

var status = {
  /**
   * Whether or not the user's profile has been completed.
   * @type {Object}
   */
  completedProfile: {
    type: Boolean,
    required: true,
    default: false,
  },
  admitted: {
    type: Boolean,
    required: true,
    default: false,
  },
  admittedBy: {
    type: String,
    validate: [
      validator.isEmail,
      'Invalid Email',
    ],
    select: false,
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  declined: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkedIn: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkInTime: {
    type: Number,
  },
  confirmBy: {
    type: Number
  },
  reimbursementGiven: {
    type: Boolean,
    default: false
  },
  tableNumber: {
    type: String,
    default: 'Not assigned'
  }
};

// define the schema for our admin model
var schema = new mongoose.Schema({

  email: {
      type: String,
      required: true,
      validate: [
        validator.isEmail,
        'Invalid Email',
      ]
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  admin: {
    type: Boolean,
    required: true,
    default: false,
  },

  timestamp: {
    type: Number,
    required: true,
    default: Date.now(),
  },

  lastUpdated: {
    type: Number,
    default: Date.now(),
  },

  teamCode: {
    type: String,
    min: 0,
    max: 140,
  },

  verified: {
    type: Boolean,
    required: true,
    default: true
  },

  salt: {
    type: Number,
    required: true,
    default: Date.now(),
    select: false
  },

  /**
   * User Profile.
   *
   * This is the only part of the user that the user can edit.
   *
   * Profile validation will exist here.
   */
  profile: profile,

  /**
   * Confirmation information
   *
   * Extension of the user model, but can only be edited after acceptance.
   */
  confirmation: confirmation,

  status: status,

});

schema.set('toJSON', {
  virtuals: true
});

schema.set('toObject', {
  virtuals: true
});

//=========================================
// Instance Methods
//=========================================

// checking if this password matches
schema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Token stuff
schema.methods.generateEmailVerificationToken = function(){
  return jwt.sign(this.email, JWT_SECRET);
};

schema.methods.generateAuthToken = function(){
  return jwt.sign(this._id, JWT_SECRET);
};

/**
 * Generate a temporary authentication token (for changing passwords)
 * @return JWT
 * payload: {
 *   id: userId
 *   iat: issued at ms
 *   exp: expiration ms
 * }
 */
schema.methods.generateTempAuthToken = function(){
  return jwt.sign({
    id: this._id
  }, JWT_SECRET, {
    expiresInMinutes: 60,
  });
};

//=========================================
// Static Methods
//=========================================

schema.statics.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

/**
 * Verify an an email verification token.
 * @param  {[type]}   token token
 * @param  {Function} cb    args(err, email)
 */
schema.statics.verifyEmailVerificationToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, email){
    return callback(err, email);
  });
};

/**
 * Verify a temporary authentication token.
 * @param  {[type]}   token    temporary auth token
 * @param  {Function} callback args(err, id)
 */
schema.statics.verifyTempAuthToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, payload){

    if (err || !payload){
      return callback(err);
    }

    if (!payload.exp || Date.now() >= payload.exp * 1000){
      return callback({
        showable: true,
        message: 'Token has expired.'
      });
    }

    return callback(null, payload.id);
  });
};

schema.statics.findOneByEmail = function(email){
  return this.findOne({
    email: new RegExp('^' + email + '$', 'i')
  });
};

/**
 * Get a single user using a signed token.
 * @param  {String}   token    User's authentication token.
 * @param  {Function} callback args(err, user)
 */
schema.statics.getByToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, id){
    if (err) {
      return callback(err);
    }
    this.findOne({_id: id}, callback);
  }.bind(this));
};

schema.statics.validateProfile = function(profile, cb){
  const discriminator = profile.discordUsername.slice(-5)
  const validDiscriminator = discriminator[0] === '#'
  for (let i = 1; i<5 && validDiscriminator; i++) {
    if(isNaN(parseInt(discriminator[i]))) {
      validDiscriminator = false;
    }
  }
  console.log('discriminator :>> ', discriminator);
  console.log('validDiscriminator :>> ', validDiscriminator);
  return cb(!(
    profile.name.length > 0 &&
    profile.adult &&
    profile.school.length > 0 &&
    ['2023','2022','2021','2020', '2024', '2025'].indexOf(profile.graduationYear) > -1 &&
    ['M', 'F', 'O', 'N'].indexOf(profile.gender) > -1 &&
    validDiscriminator && profile.discordUsername.length >= 7
    ));
};

//=========================================
// Virtuals
//=========================================

/**
 * Has the user completed their profile?
 * This provides a verbose explanation of their furthest state.
 */
schema.virtual('status.name').get(function(){

  if (this.status.checkedIn) {
    return 'checked in';
  }

  if (this.status.declined) {
    return "declined";
  }

  if (this.status.confirmed) {
    return "confirmed";
  }

  if (this.status.admitted) {
    return "admitted";
  }

  if (this.status.completedProfile){
    return "submitted";
  }

  if (!this.verified){
    return "unverified";
  }

  return "incomplete";

});

module.exports = mongoose.model('User', schema);
