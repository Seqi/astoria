let ChanApi = require('./api')

class BoardSubscriber {
	constructor(board) {
		this._board = board
		this._api = new ChanApi()
		this._ids = []
	}

	next() {
		return this._api.fetch(this._board)
			.then(pages => {
				if (!pages) {
					return
				}		
				
				// Get a single array of all threads
				let threads = pages.map(page => page.threads)
					.reduce((prev, curr) => prev.concat(curr), [])
		
				// Get threads whos ids don't exist in the cache
				let newThreads = threads.filter(thread => !this._ids.find(id => id === thread.no))

				// Store new thread ids
				this._ids = threads.map(thread => thread.no)	

				return newThreads
			})
	}
}

module.exports = BoardSubscriber