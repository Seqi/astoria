let Astoria = require('../src')
let assert = require('assert')

describe('Astoria setup', () => {
	it('should set options with valid configuration', () => {
		assert.doesNotThrow(() => new Astoria({ interval: 10 }))
	})

	it('should throw if an options is provided with an interval too low', () => {
		assert.throws(() => new Astoria({ interval: 9 }))
	})
})