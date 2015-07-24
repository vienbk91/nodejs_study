var http = require('http'),
    fs = require('fs'),
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
    now('>request from clients');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Send current time to all connected clients
/*function sendTime() {
    io.sockets.emit('time', { time: new Date().toJSON() });
}

// Send current time every 1 secs
setInterval(sendTime, 1000); */

// Emit welcome message on connection
io.sockets.on('connection', function(socket) {
now('>connnect');

  socket.on("connected", function (name) {
    var msg = name + "def";
     now('>connected');
    userHash[socket.id] = name;
    io.sockets.emit("publish", {value: msg});
  });

  socket.on('hello', function(data){
      now("hello : " + data.value);
      io.sockets.emit('hello', { value: data.value });
  });

  socket.on("publish", function (data) {
     now('publish ');
    io.sockets.emit("publish", {value:data.value});
  });

  // 
  socket.on("upgrade", function (data) {
     now('upgrade ');
  });

  socket.on("disconnect", function () {
     now('disconnect ');
    if (userHash[socket.id]) {
      var msg = userHash[socket.id] + "abc";
      delete userHash[socket.id];
      io.sockets.emit("publish", {value: msg});
    }
  });
  io.sockets.emit('hello', { value: "welcome from server" });
});

app.listen(8080);
now('Server running! Waiting on port 8080...');

function now(text) {
  console.log(new Date().toString(/T/, ' ').replace(/\..+/, '') + ' ' + text);
}