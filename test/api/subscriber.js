let assert = require('assert')
let subscriber = require('../../src/api/subscriber')
let BoardSubscriber = require('../../src/api/board-subscriber')
let ThreadSubscriber = require('../../src/api/thread-subscriber')

describe('Subscriber', () => {
	it('should throw an error if no arguments provided', () => {
		assert.throws(() => subscriber.getSubscriber())
	})

	it('should throw if only a thread id was supplied', () => {
		assert.throws(() => subscriber.getSubscriber(null, ))
	})

	it('should give a board subscriber if only board is supplied', () => {
		assert(subscriber.getSubscriber('ck') instanceof BoardSubscriber)
	})

	it('should give a thread subscriber if both board and thread are supplied', () => {
		assert(subscriber.getSubscriber('ck', 123) instanceof ThreadSubscriber)
	})
})