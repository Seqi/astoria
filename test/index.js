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

		it('should pass useHttps option into getSubscriber', () => {
			nextStub.onFirstCall()
				.resolves(1)

			let client = new Astoria({ useHttps: true })

			let unsubscribe = client
				.board('ck')
				.listen(() => { })

			// Ensure we get a function back to unsubscribe from
			assert(typeof unsubscribe === 'function')

			unsubscribe()
			
			// Ensure we've got the right subscriber
			assert.equal(getSubscriberSpy.callCount, 1)
			assert(getSubscriberSpy.calledWithExactly('ck', undefined, true))
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
			assert(getSubscriberSpy.calledWithExactly('ck', undefined, false))
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

		it('should only listen to updates if updatesOnly option is set', (done) => {
			nextStub.onFirstCall()
				.resolves([
					{ no: 1 }, 
					{ no: 2 },
					{ no: 3 },
				])

			nextStub.onSecondCall()
				.resolves([{ no: 4 }])

			nextStub.onThirdCall()
				.resolves([{ no: 5 }])

			let client = new Astoria({ interval: 0.01, updatesOnly: true })

			let unsubscribe = client
				.board('ck')
				.listen((context, data, err) => {
					unsubscribe()

					if (err) {
						done(err)
					}

					assert(data)
					assert.equal(data.length, 1)
					assert.equal(4, data[0].no)
					done()
				})
		})

		it('should not listen if the item is not found', (done) => {
			nextStub.onFirstCall()
				.rejects(new Error('not found'))

			let client = new Astoria({ interval: 0.01 })

			let spy = sinon.spy((context, data, err) => {
				// Ensure the error message is not found
				if (err.message !== 'not found') {
					done(`Expected not found message, got ${err.message}`)
				} 				
			})

			client
				.board('ck')
				.listen(spy)

			// Wait for a period of 3 'ticks' and ensure only one was called
			setTimeout(() => {
				assert.equal(spy.callCount, 1)
				done()
			}, 50)				
		})

		it('should keep listening if the item is not found and option is set to keep listening', (done) => {
			nextStub.onFirstCall()
				.rejects(new Error('not found'))

			nextStub.onSecondCall()
				.resolves(1)

			let client = new Astoria({ interval: 0.01, unsubscribeOnNotFound: false })

			let spy = sinon.spy((context, data, err) => {
				if (spy.callCount === 1) {
					assert.equal(err.message, 'not found')
				}
				else if (spy.callCount === 2) {
					assert.equal(data, 1)
					unsubscribe()
					done()
				}
			})

			let unsubscribe = client
				.board('ck')
				.listen(spy)			
		})

		it('should not listen if the item becomes not found', (done) => {
			nextStub.onFirstCall()
				.resolves(1)

			nextStub.onSecondCall()
				.resolves(2)

			nextStub.onThirdCall()
				.rejects(new Error('not found'))

			let client = new Astoria({ interval: 0.01 })

			let spy = sinon.spy((context, data, err) => {
				// Should never hit 4 calls
				if (spy.callCount === 4) {
					done('Got too many calls')
				}
				else if (err) {
					assert.equal(err.message, 'not found')
					assert.equal(spy.callCount, 3)

					// Wait a bit to ensure no more calls happen after this					
					setTimeout(() => {
						assert.equal(spy.callCount, 3)
						done()
					}, 50)
				} 				
			})

			client
				.board('ck')
				.listen(spy)			
		})

		it('should keep listening if the item becomes not found and option is set to keep listening', (done) => {
			nextStub.onFirstCall()
				.resolves(1) 

			nextStub.onSecondCall()
				.rejects(new Error('not found'))

			nextStub.onThirdCall()
				.resolves(1)

			let client = new Astoria({ interval: 0.01, unsubscribeOnNotFound: false })

			let spy = sinon.spy((context, data, err) => {
				if (spy.callCount === 1) {
					assert.equal(data, 1)
				}
				else if (spy.callCount === 2) {
					assert.equal(err.message, 'not found')
				}
				else if (spy.callCount === 3) {
					assert.equal(data, 1)
					unsubscribe()
					done()
				}
			})

			let unsubscribe = client
				.board('ck')
				.listen(spy)			
		})
	})
})