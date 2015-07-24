// Khoi tao 1 server theo dia chi ip 127.0.0.1:5555
var http = require('http');
var socketIO = require('socket.io');

var port = 5555;
var ip = '127.0.0.1';

var server = http.createServer().listen(port , ip , function(){
	console.log('Server connected at ' + ip + ':' + port);
});


var io = socketIO.listen(server);

//config
//io.set('match origin protocol', true);
//io.set('origins','*:*');

// Sau khi server va client ket noi thanh cong thi goi toi doan ma nay
var run = function(socket){
	console.log('Connect server');
	
	// Server se lang nghe su kien gui tu client, voi eventName = 'guiData'
	socket.on('guiData' , function(data){
		console.log('Du lieu gui tu client: ' + data);
		console.log('Ket qua : ' + eval(data));
		
		// Day chinh la cach phat 1 su kien den client
		// socket.emit(string event , object data) se thuc hien viec phat 1 su kien ve client,dong thoi gui du lieu va client
		var ketqua = eval(data);
		socket.emit('nhanKetqua' , ketqua );
	});
}

io.sockets.on('connection' , run);