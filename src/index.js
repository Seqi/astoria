let Poller = require('./poller')
let subscriber = require('./api/subscriber')

/**
 * Astoria options
 * @typedef {Object} options
 * @property {number} interval Interval between polling in seconds (min 10 secs). Defaults to 30 seconds.
 */

class Astoria {
	/**
	  * @param {options} options The configuration for Astoria
	  */
	constructor(options = {}) {
		let defaultOptions = {
			interval: 30
		}

		this.options = {
			...defaultOptions,
			...options
		}
	}

	/**
	 * 
	 * @param {string} board The 4chan board to target e.g. (v, ck, /biz/, /an/)
	 * @return {Astoria} Current instance of Astoria
	 */
	board(board) {
		this._board = board
		return this
	}

	/**
	 * 
	 * @param {string} thread The thread number to target (e.g. 1234567)
	 * @return {Astoria} Current instance of Astoria
	 */
	thread(thread) {
		this._thread = thread
		return this
	}

	/**
	 * Callback containing Astoria instance with new threads/posts.
	 * @callback onNewItems
	 * @param {Astoria} astoria instance of Astoria with new items.
	 * @param {int} newItems New items since last poll.
	 */

	/**
	 * Begin listening to the specified board/thread. 
	 * @param {onNewItems} callback 
	 */
	listen(callback) {
		if (!callback || typeof callback !== 'function') {
			throw new Error('Callback must be a function')
		}

		if (!this._board) {
			throw new Error('A board must be specified')
		}

		let currentSubscriber = subscriber.getSubscriber(this._board, this._thread)
		let poller = new Poller(this.options.interval)

		// Little hack if they cancel the listener before actually listening
		let isCancelled = false

		// Get initial set of data and send it back to the user if requested
		currentSubscriber.next()
			.then(
				data => callback(this, data), 
				err => callback(this, null, err)
			)
			// Then begin polling for new items
			.then(() => {
				if (isCancelled) {
					return
				}

				poller.onPoll(() => {
					return currentSubscriber.next()
						.then(
							data => callback(this, data),
							err => callback(this, null, err)
						)
				})

				poller.poll()
			})

		// Give the caller a way of stopping the subscription
		return () => {
			isCancelled = true
			poller.cancel()
		}
	}
}

module.exports = Astoria