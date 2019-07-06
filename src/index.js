let Poller = require('./poller')

/**
 * Astoria options
 * @typedef {Object} options
 * @property {number} interval Interval between polling in seconds (min 10 secs). Defaults to 30 seconds.
 */

class Astoria {
	/**
	  * @param {options} options The configuration for Astoria
	  */
	constructor(options) {
		if (options && options.interval < 10) {
			throw new Error('Cannot set interval to less than 10 seconds to abide by 4chan API rules.')
		}

		this.options = {
			interval: 30,
			...options
		}

		this.poller = new Poller(options.interval)
	}

	/**
	 * 
	 * @param {string} board The 4chan board to target e.g. (v, ck, /biz/, /an/)
	 * @return {Astoria} Current instance of Astoria
	 */
	board(board) {
		this.board = board
		return this
	}

	/**
	 * 
	 * @param {string} thread The thread number to target (e.g. 1234567)
	 * @return {Astoria} Current instance of Astoria
	 */
	thread(thread) {
		this.thread = thread
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
		this.poller.onPoll(() => {
			callback(this)
		})

		this.poller.poll()

		return this
	}

	/**
	 * Remove all listeners to this Astoria instance.
	 */
	stopListening() {
		this.poller.cancel()
	}
}

module.exports = Astoria