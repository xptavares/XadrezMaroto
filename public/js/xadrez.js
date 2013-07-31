(function () {
  window.Xadrez = {
    socket : null,
  
    initialize : function(socketURL) {
      this.socket = io.connect(socketURL);
	  this.socket.on('newPosition', this.newPosition);
    },
   	
	sendPosition : function(newPos){
		this.socket.emit('changePosition', {
			pos: newPos
		});
		
		return false;
	},
	
	newPosition : function(data){
		var pos = data.pos || 'anonymous';
		board.position(pos);
		var msg = $('<div class="history">' + pos + '</div>');
		$('#history').append(msg);
	}
  };
}());