var http = require('http');
 
// 1.ƒ‚ƒWƒ…[ƒ‹ƒIƒuƒWƒFƒNƒg‚Ì‰Šú‰»
var fs = require("fs");
var sys = require ('sys'),
url = require('url'),
http = require('http'),
qs = require('querystring');

// ƒ†[ƒUŠÇ—ƒnƒbƒVƒ…
var userHash = {};

// 2.ƒCƒxƒ“ƒg‚Ì’è‹`
var server = require('http').Server();
var socketIO = require('socket.io');
var io = socketIO.listen(server);

io.sockets.on("connection", function (socket) {
  now('>connnect');

  // Ú‘±ŠJŽnƒJƒXƒ^ƒ€ƒCƒxƒ“ƒg(Ú‘±Œ³ƒ†[ƒU‚ð•Û‘¶‚µA‘¼ƒ†[ƒU‚Ö’Ê’m)
  socket.on("connected", function (name) {
    var msg = name + "‚が入室しました";
     now('>connected');
    userHash[socket.id] = name;
    io.sockets.emit("publish", {value: msg});
  });

  socket.on('heartbeat', function(data) {
        now('>heartbeat !!!');
        io.sockets.emit('hello', { value: data.value });
    });
  socket.on('hello', function(data){
      now(">Client say : " + data.value);
    // var id = socket.id;  //For only sender
    //  console.log(id);
      socket.broadcast.emit('hello', { value: data.value });
    //  io.sockets.emit('hello', { value: data.value });
  });

  // ƒƒbƒZ[ƒW‘—MƒJƒXƒ^ƒ€ƒCƒxƒ“ƒg
  socket.on("publish", function (data) {
     now('publish ');
    io.sockets.emit("publish", {value:data.value});
  });

  // 
  socket.on("upgrade", function (data) {
     now('upgrade ');
  });

  // Ú‘±I—¹‘g‚Ýž‚ÝƒCƒxƒ“ƒg(Ú‘±Œ³ƒ†[ƒU‚ðíœ‚µA‘¼ƒ†[ƒU‚Ö’Ê’m)
  socket.on("disconnect", function () {
     now('disconnect ');
    if (userHash[socket.id]) {
      var msg = userHash[socket.id] + "が退出しました";
      now(msg + ".disconnected")
      delete userHash[socket.id];
      io.sockets.emit("publish", {value: msg});
    }
  });
  //io.sockets.emit('hello', { value: "welcome from server" }); //for All
  //socket.emit('hello',{value: "Hello From server"}); // for One
});
server.listen('8080');
now('Server running! Waiting on port 8080...');

function now(text) {
  console.log(new Date().toString(/T/, ' ').replace(/\..+/, '') + ' ' + text);
}