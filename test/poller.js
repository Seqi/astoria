let assert = require('assert')
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
})