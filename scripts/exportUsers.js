require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.REMOTE_URI;
var User            = require('../app/server/models/User');
var fs              = require('fs');
var {Parser}        = require('json2csv');
mongoose.connect(database);

let schools = [
  // 'Tecnológico de Monterrey Campus Monterrey',
  'Tecnológico de Monterrey Campus Guadalajara'
  // 'Tecnológico de Monterrey Campus Puebla',
  // 'Tecnológico de Monterrey Campus Ciudad de México',
  // 'Tecnológico de Monterrey Campus Santa Fé'
  // 'Tecnológico de Monterrey Campus Laguna',
  // 'Tecnológico de Monterrey Campus San Luis',
  // 'Universidad de Monterrey'

]

let fields = [{
  label: 'Email',
  value: 'email'
},{
  label: 'Name',
  value: 'profile.name'
},{
  label: 'Status',
  value: 'status.name'
},{
  label: 'Degree',
  value: 'profile.degree'
},{
  label: 'Gender',
  value: 'profile.gender'
},{
  label: 'School',
  value: 'profile.school'
},{
  label: 'Grad Year',
  value: 'profile.graduationYear'
},{
  label: 'Description',
  value: 'profile.description'
}];

let opt = {
  fields,
  excelStrings: true
}
User.find({'profile.school': {$in: schools} }, (err, users) => {
  if(err) return console.log('err :', err);
  console.log('users.length :', users.length);
  console.log('users[0] :', users[0]);

  let u = users.map( user => {
    return user.toJSON()
  })
  
  const parser = new Parser(opt);
  const csv = parser.parse(u); 
  
  // console.log('u[0] :', u[0]);


  fs.writeFile('foraneos.csv', csv,'ascii' ,(err)=>{
    if(err) return console.log('err :', err);
    console.log("Users written to foraneos.csv");
    
  })  

})
