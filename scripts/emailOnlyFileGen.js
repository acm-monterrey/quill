const { log } = require('console');

fs = require('fs');

var file = fs.readFileSync('failed.txt').toString().split('\n')
// console.log('file :>> ', file);
var emails = file.map(line => line.split('\t')[0]);

// console.log('emails :>> ', emails);

var text = emails.join('\n')
fs.appendFile('resend.txt', text, (err) => {
  if(err) console.error(err);
  console.log('done');
})