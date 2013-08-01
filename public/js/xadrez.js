(function () {
	window.Xadrez = {
		socket : null,
		board : null,
		
		onDrop : function(source, target, piece, newPos, oldPos, orientation) {
			console.log("Source: " + source);
			console.log("Target: " + target);
			console.log("Piece: " + piece);
			console.log("New position: " + ChessBoard.objToFen(newPos));
			console.log("Old position: " + ChessBoard.objToFen(oldPos));
			console.log("Orientation: " + orientation);
			console.log("--------------------");
			Xadrez.socket.emit('move', {
				source: source,
				target: target,
				piece: piece,
				newPos: ChessBoard.objToFen(newPos),
				oldPos: ChessBoard.objToFen(oldPos),
				orientation: orientation
			});
		},
		
		initialize : function(socketURL) {		
			var cfg = {
				draggable: true,
				position: 'start',
				onDrop: this.onDrop
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
			var move = data.source + "-" + data.target;
			Xadrez.board.move(move);
			var msg = $('<div class="history">' + move + '</div>');
			$('#history').append(msg);
		}
	};
}());