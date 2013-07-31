var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
  
server.listen(80);

app.use("/", express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket) {

	socket.on('disconnect', function () {
		
  	});
	
	socket.on('changePosition', function (data) {
		io.sockets.emit('newPosition', data);
	});
});





