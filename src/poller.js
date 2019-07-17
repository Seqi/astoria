let EventEmitter = require('events').EventEmitter

/**
 * An extension of the EventEmitter to allow easy polling of a function.
 */
class Poller extends EventEmitter {
	/**
	 * @param {number} interval Time between polling in seconds.
	 */
	constructor(interval) {
		super()
		this.interval = interval
	}

	/**
	 * Begin polling.
	 */
	poll() {
		setTimeout(() => this.emit('poll'), this.interval * 1000)
	}

	/**
	 * The callback to trigger at each interval.
	 * @callback PollCallback
	 */

	/**
	 * Provide the behaviour that happens each interval.
	 * @param {PollCallback|Promise.<void>} callback The callback to trigger at each interval.
	 */
	onPoll(callback) {
		this.on('poll', () => {
			Promise.resolve(callback())
				.then(() => this.poll())
		})
	}

	/**
	 * Remove all events attached to the poll.
	 */
	cancel() {
		this.removeAllListeners()
	}
}

module.exports = Poller