var http = require('http');
var socketIO = require('socket.io');

var port = 8080;
var ip = '127.0.0.1';

var server = http.createServer().listen(port , ip , function(){
	console.log('Server connected at ' + ip + ':' + port);
});

var io = socketIO.listen(server);

io.sockets.on('connection' , function(socket){
	console.log('Client connection server Succesfull');
	
	// Nhan du lieu gui tu client
	socket.on('hello' , function(data){
		
		var dt = JSON.parse(data);
		console.log('DT : ' , dt);
		console.log('Data: ' + data);
		console.log('Data Value : ' , dt[0]["value"]);
		socket.emit('hello' ,{ value : dt[0]["value"]} );
	});
	
	
	socket.on('disconnect' , function(){
		console.log('Client disconnect Succesfull');
	});
	
	socket.emit('hello' , {value : 'Welcom'});
});