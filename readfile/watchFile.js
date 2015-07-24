var fs = require('fs');
console.log('Start');

fs.watchFile('sample.txt' , function(current , previous){
	console.log('Old: ', current);
	console.log('New: ', previous);
});

console.log('End');