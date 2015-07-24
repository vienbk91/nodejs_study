var http = require('http');
var socketIO = require('socket.io');

var port = 5050;
var ip = '127.0.0.1';

var server = http.createServer().listen(port , ip , function(){
	console.log('Server connected at ' + ip + ':' + port);
});

// Doi tuong socket duoc tao ra bang cach lang nghe cong 5050
// Neu connect voi localhost thi chi can listen(port) la co the tao socket
var io = socketIO.listen(server);

// Thuc hien viec lang nghe cua socket
// 3 event do SocketIO cung cap: connection , message va disconnection khi co client ket noi toi server
/**
 * socketName.sockets.on('connection' , function(socket){
 *  // socket la 1 doi tuong socket su dung trong ham callback nay
 * ++++++++++++++++++++++++
 * + Xu ly giao tiep client va server bang cac event message
 * ++++++++++++++++++++++++
 *  socket.on('message' , function(data){
 *  // Khi co giao tiep voi client
 *  }); 
 * 
 *  socket.on('disconnection' , function(data){
 *  // Khi co client ngat ket noi voi server thi client se gui thong diep den server
 *  // Va server se xu ly viec ngat ket noi tai day
 *  });
 * });
 * 
 */
 // Ham nhan su kien connection khi co 1 client nao do ket noi vao
io.sockets.on('connection' , function(socket){
	console.log('Server connected');
	
	// Gui ngay 1 loi chao den client do
	socket.emit('loichao' , 'Chao mung ban den voi chat room!');

	// Thong bao neu co client khac dang nhap vao server
	// broadcast: khap noi , tung ra xung quanh
	// Su dung broadcast de gui toi cac client khac(tru no) khi co su gui-nhan du lieu giua client voi server
	// Vi the ma chi khi co nguoi dang nhap vao he thong thi no moi hien thi thong bao nay
	socket.broadcast.emit('loichao' , 'Some one is online...');
	
	// Thuc hien nhan du lieu tu client theo phuong thuc socket.on
	socket.on('guiData' , function(data){
		// Sau do se gui du lieu den client do
		socket.emit('nhanData' , data);
		// Gui du lieu toi cac client khac
		socket.broadcast.emit('nhanData' , data);
	});
	
	// Neu co client ngat ket noi
	socket.on('disconnection' , function(){
		socket.emit('loichao'  , 'Some one is offline...');
	});
});