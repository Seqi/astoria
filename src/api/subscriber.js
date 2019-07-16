let BoardSubscriber = require('./board-subscriber')
let ThreadSubscriber = require('./thread-subscriber')

module.exports.getSubscriber = (board, thread, useHttps) => {
	if (!board) {
		throw new Error('Must specify at least a board')
	}

	if (!thread) {
		return new BoardSubscriber(board, useHttps)
	}
	
	return new ThreadSubscriber(board, thread, useHttps)
}