let ChanApi = require('./api')

class ThreadSubscriber {
	constructor(board, thread) {
		this._board = board
		this._thread = thread
		this._api = new ChanApi()
		this._ids = []
	}

	next() {
		return this._api.fetch(this._board, this._thread)
			.then(data => {
				if (data && data.posts) {
					let newPosts = data.posts.filter(post => !this._ids.find(id => id === post.no))
					this._ids = data.posts.map(post => post.no)
		
					return newPosts
				}
			})
	}
}

module.exports = ThreadSubscriber