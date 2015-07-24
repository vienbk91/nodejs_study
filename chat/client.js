// Khai bao cac bien theo id cua the HTML
var input = document.getElementById('input');
var output = document.getElementById('output');
var send = document.getElementById('send');

// Connect voi server
var socket = io.connect('http://127.0.0.1:5050');

// Thuc hien hien thi loi chao den tat ca cac client
// Nhan du lieu tra ve tu server su dung phuong thuc socket.on
socket.on('loichao' , function(data){
	output.value = output.value + '\n' + data;
});


socket.on('nhanData' , function(data){
	output.value = output.value + '\n' + data;
});

send.onclick = function(){
	// Gui data len server theo phuong thuc emit	
	socket.emit('guiData' , input.value);	
};


