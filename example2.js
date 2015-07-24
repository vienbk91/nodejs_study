/* Khoi dong may chu lang nghe o phia server nhung
khong thuc hien gi ca */
var http = require('http');
var server = http.createServer();

server.listen(8888 , '127.0.0.1');
console.log('Server running at http://127.0.0.1:8888/');

/*
function funTest(req , res)
{
	res.writeHead(200 , {'Content-Type' : 'text/plain'});
	res.end('HelloWorld\n');
}
*/
