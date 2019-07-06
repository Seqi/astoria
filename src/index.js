/**
 * Astoria options
 * @typedef {Object} options
 * @property {number} interval Interval between polling in seconds (min 30 secs)
 */

class Astoria {
	/**
	  * @param {options} options The configuration for Astoria
	  */
	constructor(options) {
		if (options.interval < 10) {
			throw new Error('Cannot set interval to less than 10 seconds to abide by 4chan API rules.')
		}

		this.options = options
	}
}

module.exports = Astoria