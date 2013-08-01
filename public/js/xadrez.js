(function () {
	window.Xadrez = {
		socket : null,
		board : null,
		game : null,
		
		onDragStart : function(source, piece, position, orientation) {
			if (Xadrez.game.in_checkmate() === true || Xadrez.game.in_draw() === true ||
					(Xadrez.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
					(Xadrez.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
				return false;
			}
		},
		
		onDrop : function(source, target, piece, newPos, oldPos, orientation) {
			//console.log("Source: " + source);
			//console.log("Target: " + target);
			//console.log("Piece: " + piece);
			//console.log("New position: " + ChessBoard.objToFen(newPos));
			//console.log("Old position: " + ChessBoard.objToFen(oldPos));
			//console.log("Orientation: " + orientation);
			//console.log("--------------------");
			Xadrez.socket.emit('move', {
				source: source,
				target: target,
				piece: piece,
				newPos: ChessBoard.objToFen(newPos),
				oldPos: ChessBoard.objToFen(oldPos),
				orientation: orientation
			});
			
			// see if the move is legal
			var move = Xadrez.game.move({
				from: source,
				to: target,
				promotion: 'q' // NOTE: always promote to a pawn for example simplicity
			});

			// illegal move
			if (move === null) return 'snapback';

			Xadrez.updateStatus();
		},
		
		onSnapEnd : function() {
			board.position(Xadrez.game.fen());
		},
		
		updateStatus : function() {
			var status = '';

			var moveColor = 'White';
			if (Xadrez.game.turn() === 'b') {
				moveColor = 'Black';
			}

			// checkmate?
			if (Xadrez.game.in_checkmate() === true) {
				status = 'Game over, ' + moveColor + ' is in checkmate.';
			}

			// draw?
			else if (Xadrez.game.in_draw() === true) {
				status = 'Game over, drawn position';
			}

			// game still on
			else {
				status = moveColor + ' to move';

				// check?
				if (Xadrez.game.in_check() === true) {
				  status += ', ' + moveColor + ' is in check';
				}
			}

			$('#status').html(status);
			$('#fen').html(Xadrez.game.fen());
			$('#pgn').html(Xadrez.game.pgn());
		},
		
		initialize : function(socketURL) {		
			var cfg = {
				draggable: true,
				position: 'start',
				onDragStart: this.onDragStart,
				onDrop: this.onDrop,
				onSnapEnd: this.onSnapEnd
			};
			
			this.game = new Chess();
			this.board = new ChessBoard('board', cfg);
			this.socket = io.connect(socketURL);
			
			$('#startPositionBtn').on('click', this.board.start);

			this.socket.on('move', this.move); 
			this.socket.on('newPosition', this.newPosition);

			this.updateStatus();
		},

		newPosition : function(data){
			Xadrez.board.position(data);
		},
		
		move : function(data){
			var move = data.source + "-" + data.target;
			Xadrez.board.move(move);
			
			// see if the move is legal
			var move = Xadrez.game.move({
				from: data.source,
				to: data.target,
				promotion: 'q' // NOTE: always promote to a pawn for example simplicity
			});
			Xadrez.updateStatus();
		}
	};
}());