
var http = require('http');
http.createServer(function (request , response){
	response.writeHead(200 , {'Content-Type' : 'text/plain'});
	response.end('HelloWorld\n');

}).listen(1337 , '127.0.0.1');


setTimeout(function(){
	console.log('I display after 5s!!!')
}, 5000);
console.log('HelloWorld\n');

console.log('Server running at http://127.0.0.1:1337/');