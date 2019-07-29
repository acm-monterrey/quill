function clone(){
  require('dotenv').load({silent:true});
  // Connect locally to mongodb
  
  const mongoose = require('mongoose'),
        localDB = process.env.MONGODB_URI || "mongodb://localhost:27017",
        remoteDB = process.env.REMOTE_URI,
        Settings = require('../app/server/models/Settings'),
        User = require('../app/server/models/User');
  mongoose.Promise = Promise;
  
  // Connect to remote db
  if(!remoteDB) return console.log("NO REMOTE URI");
        
  let local = mongoose.createConnection(localDB);
  let remote = mongoose.createConnection(remoteDB);

  console.log("LOCAL DB name => ", local.name);
  console.log("REMOTE DB name => ", remote.name);
  

  // Gets remote settings
  remote.model('Settings').findOne({}).select('-_id')
    .then(settingsR => {
      console.log("New Settings :", settingsR)
      // Updates local settings
      return local.model('Settings').findOneAndUpdate({}, settingsR)
    })
    .then(settingsPrior => {
      console.log('Old Settings :', settingsPrior);
      // Droops users
      return local.db.dropCollection('users')
    })
    .then(() =>{
      console.log("Dropped local user collection");
      // Gets remote users
      return remote.model('User').find({}).select('+password +salt +status.admittedBy')
    })
    .then(usersR => {
      console.log('Amount of remote users :', usersR.length);
      let LocalUser = local.model('User');
      let p = usersR.map( user => {
        return new Promise((resolve, reject) => {
          let u = new LocalUser(user.toObject());
          u.save((err,newUser) => {
            if(err) return reject(err)
            resolve(newUser);
          })
        });
      })
      // Creates users locally
      return Promise.all(p)
    })
    .then(newUsers => {
      console.log('New Users :', newUsers.length);
      process.exit(0);
    })
    .catch(err =>{
      console.log("ERROR");
      console.log('err :', err);
      process.exit(1);
    })
}

clone();