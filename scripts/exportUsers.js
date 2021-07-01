require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.DATABASE;
var User            = require('../app/server/models/User');
var fs              = require('fs');
var {Parser}        = require('json2csv');
mongoose.connect(database);

let schools = [
  'Tecnológico de Monterrey Campus Monterrey',
  'Tecnológico de Monterrey Campus Guadalajara',
  'Tecnológico de Monterrey Campus Puebla',
  'Tecnológico de Monterrey Campus Ciudad de México',
  'Tecnológico de Monterrey Campus Santa Fé',
  'Tecnológico de Monterrey Campus Laguna',
  'Tecnológico de Monterrey Campus San Luis',
  'Universidad de Monterrey',
]

let fields = [{
  label: 'Name',
  value: 'profile.name'
},{
  label: 'Email',
  value: 'email'
},{
  label: 'Phone',
  value: 'confirmation.phoneNumber'
},{
  label: 'School',
  value: 'profile.school'
},{
  label: 'Degree',
  value: 'profile.degree'
},{
  label: 'Grad Year',
  value: 'profile.graduationYear'
}];

let opt = {
  fields,
  excelStrings: true
}
User.aggregate([
  { $match: {
    'status.confirmed': false, 
    'status.admitted': true, 
    'status.declined': false, 
    admin: false
    }
  }, {
    $group: {
      _id: '$teamCode',
    }
  }], (err, teams) => {
    if(err) return console.error(err);
    console.log('teams.length :>> ', teams.length);
    console.log('teams :>> ', teams);
    const filtered = teams.map(team => team._id);
    User.find({teamCode: { $in: filtered}}, (err, users) => {
      if(err) return console.log('err :', err);
      console.log('users.length :', users.length);
      console.log('users[0] :', users[0]);
    
      let u = users.map( user => {
        return user.toJSON()
      })
      
      const parser = new Parser(opt);
      const csv = parser.parse(u); 
      
      // console.log('u[0] :', u[0]);
    
    
      fs.writeFile('equiposIncompletos.csv', csv,'ascii' ,(err)=>{
        if(err) return console.log('err :', err);
        console.log("Users written to foraneos.csv");
        
      })  
      
    })

})
