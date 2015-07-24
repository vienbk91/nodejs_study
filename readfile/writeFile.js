var fs = require('fs');
console.log('Start');

var content = 'WriteFile : Xin chao ! Toi la Vien BOI';
fs.writeFile('sample.txt' , content , function(error){
	if (error) {
		console.log('Error: ' + error);
	}else{
		console.log('Write file succesful');
	}
});

console.log('End');