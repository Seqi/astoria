let EventEmitter = require('events').EventEmitter

class Poller extends EventEmitter {
	/**
	 * @param {number} interval Time between polling.
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
	 * Provide the callback for 
	 * @param {The} callback 
	 */
	onPoll(callback) {
		this.on('poll', () => {
			callback()
			this.poll()
		})
	}

	cancel() {
		this.removeAllListeners()
	}
}

module.exports = Poller