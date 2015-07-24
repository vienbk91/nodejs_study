global.mongoose = require('mongoose');
global.Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/rts',function(err) {
	if(err) {
		console.log('connection error!');
		console.log(err);
	}else {
		console.log('connection success');
	}

});