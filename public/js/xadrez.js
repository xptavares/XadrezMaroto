(function () {
	window.Xadrez = {
		socket : null,
		board : null,
		
		onChange : function(oldPos, newPos) {	
			console.log("Position changed:");
			console.log("oldPos: " + oldPos);
			console.log("newPos: " + newPos);
			console.log("Old position: " + ChessBoard.objToFen(oldPos));
			console.log("New position: " + ChessBoard.objToFen(newPos));
			console.log("--------------------");
			
			Xadrez.socket.emit('changePosition', {
				newPos: ChessBoard.objToFen(newPos)
			});
			
		},
		
		onDrop : function(source, target, piece, newPos, oldPos, orientation) {
			console.log("Source: " + source);
			console.log("Target: " + target);
			console.log("Piece: " + piece);
			console.log("New position: " + ChessBoard.objToFen(newPos));
			console.log("Old position: " + ChessBoard.objToFen(oldPos));
			console.log("Orientation: " + orientation);
			console.log("--------------------");
			Xadrez.socket.emit('move', {
				move: source + "-" + target
			});
		},
		
		
		initialize : function(socketURL) {		
			var cfg = {
				draggable: true,
				position: 'start',
				onDrop: this.onDrop,
				onChange: this.onChange
			};
			
			this.board = new ChessBoard('board', cfg);
			this.socket = io.connect(socketURL);
			
			$('#startPositionBtn').on('click', this.board.start);

			this.socket.on('move', this.move); 
			this.socket.on('newPosition', this.newPosition); 
		},

		newPosition : function(data){
			Xadrez.board.position(data);
		},
		
		move : function(data){
			var move = data.move || 'anonymous';
			Xadrez.board.move(move);
			var msg = $('<div class="history">' + move + '</div>');
			$('#history').append(msg);
		}
	};
}());