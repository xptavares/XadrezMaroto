var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
  
server.listen(80);

app.use("/", express.static(__dirname + '/public'));

var position = 'start';

io.sockets.on('connection', function (socket) {
	
	io.sockets.emit('newPosition', position);
	
	socket.on('disconnect', function () {
		
  	});
	
	socket.on('move', function (data) {
		position = data.newPos;
		io.sockets.emit('move', data);
	});
});





