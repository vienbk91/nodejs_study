// Include 1 module cua nodejs ten la fs(file system)

var fs = require('fs');
console.log('Start');
fs.readFile('sample.txt' , function(error , data){
	console.log('Contents: ' + data);
	console.log('Error: ' + error);
});
console.log('End read file');