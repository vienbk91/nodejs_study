// Connect toi server theo cong 5555
var socket = io.connect('http://127.0.0.1:5555');

var send = document.getElementById('send');
// Khi client thuc hien event onClick
send.onclick = function(){
		
		var input = document.getElementById('input');
		socket.emit('guiData' , input.value);
		console.log('Click + data gui di ' + input.value);
		
		
		var output = document.getElementById('output');
		socket.on('nhanKetqua' , function(data){
		output.innerHTML = '=' + data;
		console.log('Du lieu nhan tu server : ' + data);
		
	});
};


