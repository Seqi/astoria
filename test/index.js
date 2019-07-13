let Astoria = require('../src')
let assert = require('assert')
let proxyquire = require('proxyquire')
let sinon = require('sinon')

describe('Astoria client', () => {
	describe('Setup', () => {
		it('should create instance with no configuration', () => {
			assert.doesNotThrow(() => new Astoria())
		})
	
		it('should create instance with valid configuration', () => {
			assert.doesNotThrow(() => new Astoria({ interval: 10 }))
		})
	})

	describe('Listener', () => {
		let Astoria
		let nextStub
		let getSubscriberSpy

		beforeEach(() => {
			// Stub the 'next' call on the subscriber 
			nextStub = sinon.stub()
			
			// Fake the subscriber module
			let subscriber = {
				getSubscriber: () => {
					return {
						next: nextStub
					}}
			}

			// Spy on the getSubscriber calls
			getSubscriberSpy = sinon.spy(subscriber, 'getSubscriber')
			
			// Inject this behaviour into the client
			Astoria = proxyquire('../src/', {
				'./api/subscriber': subscriber
			})
		})
	

		it('should throw if a function callback isnt supplied', () => {
			let client = new Astoria({interval: 0.1})

			assert.throws(() => client.listen(123))
			assert(getSubscriberSpy.notCalled)
		})

		it('should throw if a board isnt specified', () => {
			let client = new Astoria({interval: 0.1})

			assert.throws(() => client.listen(() => {}))
			assert(getSubscriberSpy.notCalled)
		})

		it('should return data on listen, and stop listening when cancelled', (done) => {
			nextStub.onFirstCall()
				.resolves(1)

			let client = new Astoria()

			let unsubscribe = client
				.board('ck')
				.listen((context, data, err) => {
					if (err) {
						done(err)
					}

					if (data === 1) {
						unsubscribe()

						// Check we have the right context
						assert.equal(context._board, 'ck')
						assert(!context._thread)
						done()
					}

					else {
						unsubscribe()
						done('Retrieved too many values!')
					}
				})

			// Ensure we get a function back to unsubscribe from
			assert(typeof unsubscribe === 'function')
			
			// Ensure we've got the right subscriber
			assert.equal(getSubscriberSpy.callCount, 1)
			assert(getSubscriberSpy.calledWithExactly('ck', undefined))
		})

		it('should pass an error if the retrieval fails', (done) => {
			nextStub.onFirstCall()
				.rejects('Error')

			let client = new Astoria()

			let unsubscribe = client
				.board('ck')
				.listen((context, data, err) => {
					if (err) {
						unsubscribe()
						done()
					} else {
						unsubscribe()
						done('Expected an error but got nothing')
					}
				})
		})

		it('should continue to listen to data until unsubscribed', (done) => {
			let expectedResults = [1, 2, 3]

			expectedResults.forEach((val, i) => {
				nextStub.onCall(i)
					.resolves(val)
			})

			nextStub.onCall(3)
				.rejects('Got too many results!')

			let client = new Astoria({ interval: 0.01 })

			let gotResults = []
			let unsubscribe = client
				.board('ck')
				.listen((context, data, err) => {
					if (err) {
						unsubscribe()
						done(err)
					}

					gotResults.push(data)

					if (data === 3) {
						unsubscribe()

						// Check we've received all the values
						assert.equal(3, gotResults.length)
						gotResults.forEach(val => {
							if (!expectedResults.find(r => r === val)) {
								done(`Received a result ${val} that wasnt expected`)
							}
						})

						done()
					}
				})
		})
	})
})