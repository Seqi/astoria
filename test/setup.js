let Astoria = require('../src')
let assert = require('assert')

describe('Setup', () => {
	it('should create instance with no configuration', () => {
		assert.doesNotThrow(() => new Astoria())
	})

	it('should create instance with valid configuration', () => {
		assert.doesNotThrow(() => new Astoria({ interval: 10 }))
	})

	it('should throw if an options is provided with an interval too low', () => {
		assert.throws(() => new Astoria({ interval: 9 }))
	})
})