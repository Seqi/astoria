let Poller = require('./poller')
let subscriber = require('./api/subscriber')

/**
  * A 4chan board and thread listener.
  */
class Astoria {
	/**
	  * @param {AstoriaOptions} options The configuration for Astoria
	  */
	constructor(options = {}) {
		if (typeof options !== 'object') {
			throw new Error('Options must be an object')
		}

		let defaultOptions = {
			interval: 30,
			updatesOnly: false,
			unsubscribeOnNotFound: true,
			useHttps: false
		}

		/**
		 * The current options set being used.
		 * @type {AstoriaOptions} options
		 */
		this.options = {
			...defaultOptions,
			...options
		}
	}

	/**
	 * Sets the target board.
	 * @param {string} board The 4chan board to target e.g. (v, ck, /biz/, /an/)
	 * @return {Astoria} Current instance of Astoria
	 */
	board(board) {
		this._board = board.replace(/\//g, '')
		return this
	}

	/**
	 * Sets the target thread.
	 * @param {string} thread The thread number to target (e.g. '1234567')
	 * @return {Astoria} Current instance of Astoria
	 */
	thread(thread) {
		this._thread = thread
		return this
	}

	/**
	 * Begin listening to the specified board/thread. 
	 * @param {AstoriaResponse} callback The behaviour to trigger when updates are received.
	 * @return {function} A function which unsubscribes from the listener when called.
	 */
	listen(callback) {
		// Keep local reference of instance vars to prevent overwrites
		let ctx = {
			board: this._board,
			thread: this._thread,
			options: this.options,		
		}

		if (!callback || typeof callback !== 'function') {
			throw new Error('Callback must be a function')
		}

		if (!ctx.board) {
			throw new Error('A board must be specified')
		}

		let currentSubscriber = subscriber.getSubscriber(ctx.board, ctx.thread, ctx.options.useHttps)
		let poller = new Poller(ctx.options.interval)

		// Little hack if they cancel the listener before actually listening
		let isCancelled = false

		// Get initial set of data and send it back to the user if requested
		currentSubscriber.next()
			.then(
				data => !ctx.options.updatesOnly && callback(ctx, data), 
				err => {
					if (err.message === 'not found' && ctx.options.unsubscribeOnNotFound) {
						// Poller won't have polled yet so we can just set the flag
						isCancelled = true
					}

					callback(ctx, null, err)
				}
			)
			// Then begin polling for new items
			.then(() => {
				if (isCancelled) {
					return
				}

				poller.onPoll(() => {
					return currentSubscriber.next()
						.then(
							data => data && callback(ctx, data),
							err => {
								if (err.message === 'not found' && ctx.options.unsubscribeOnNotFound) {
									poller.cancel()
								}
			
								callback(ctx, null, err)
							}
						)
				})

				poller.poll()
			})

		// Give the user a way to unsubscribe
		return () => {
			isCancelled = true
			poller.cancel()
		}
	}
}

/**
 * Callback containing new threads/posts.
 * @callback AstoriaResponse
 * @param {AstoriaResponseContext} context The context of the listener, including board, thread and options.
 * @param {Array.<Object>} items New threads/posts since last poll.
 * @param {Error} err Any error that occurred.
 */

/**
 * Astoria options
 * @typedef {Object} AstoriaOptions
 * @property {number} [interval] Interval between thread/board polling in **seconds**. Please be 
 * 		respectful to the server and don't set this below 10 seconds! *Defaults to 30 seconds.*
 * @property {boolean} [updatesOnly] If set to true, when listening to a board/thread, only new 
 * 		threads/posts will be sent. Otherwise all current threads/posts will be sent immediately.
 * 		_Defaults to *false*
 * @property {boolean} [unsubscribeOnNotFound] Whether to automatically stop listening if/when a
 * 		board/thread returns 404. *Defaults to true.*
 * @property {boolean} [useHttps] Connect to the 4chan API using HTTPS. Only use this if you're
 * 		using this with an application that also uses HTTPS. *Defaults to false.*
 */

/** 
  * Astoria response context
  * @typedef {Object} AstoriaResponseContext
  * @property {string} board The board currently being listened to.
  * @property {string} thread The thread currently being listened to if applicable.
  * @property {AstoriaOptions} options The options applied to the listener.
  */

module.exports = Astoria