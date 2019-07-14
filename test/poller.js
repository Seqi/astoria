let assert = require('assert')
let sinon = require('sinon')
let Poller = require ('../src/poller')

describe('Poller', () => {
	it('should emit after the specified interval', (done) => {
		let interval = 0.02 
		let poller = new Poller(interval)
		let start = new Date()
		
		poller.on('poll', () => {
			// Ensure it doesnt trigger straight away
			let end = (new Date() - start) / 1000 

			// Give it a little (33%) leeway for the setup to run
			let leeway = interval * 0.33
			let lowerBound = interval - leeway
			let upperBound = interval + leeway

			assert(lowerBound < end && upperBound > end)
			done()
		})

		poller.on('error', assert.fail)

		poller.poll()
	})

	it('should fire poll event every interval period and cancel', (done) => {
		let interval = 0.02 
		let poller = new Poller(interval)

		let count = 0
		poller.onPoll(() => {
			count++

			if (count > 1) {
				poller.cancel()
				done()
			}
		})

		poller.on('error', assert.fail)

		poller.poll()
	})

	it('should wait for callback code to finish before polling again', (done) => {
		let interval = 0.02 
		let poller = new Poller(interval)
		let start = new Date()

		let pollSpy = sinon.spy(poller, 'poll')
		
		poller.onPoll(() => new Promise((resolve) => {
			setTimeout(() => {
				// Wait for poll to be called three times
				if (pollSpy.callCount === 3) {
					// Stop the poll
					poller.cancel()

					// Interval between polls = 20ms
					// Poll callback = 10ms
					// Interval -> Callback -> Interval -> Callback -> Interval -> Callback
					// (20 * 3) + (10 * 3)
					// Whole round trip should take at least 90 ms
					let end = new Date()
					assert((end - start) >= 90)
					done()
				}
				resolve()
			}, 10)
		}))

		poller.on('error', assert.fail)

		poller.poll()
	})
})