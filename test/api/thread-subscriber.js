let assert = require('assert')
let sinon = require('sinon')
let proxyquire = require('proxyquire')

describe('Thread subscriber', () => {
	let fetchStub
	let subscriber

	beforeEach(() => {
		// Stub the api
		fetchStub = sinon.stub()
		let apiStub = function() {
			this.fetch = fetchStub
		}

		// Inject the stub into the subscriber
		let ProxyThreadSubscriber = proxyquire('../../src/api/thread-subscriber', {
			'./api': apiStub
		})

		subscriber = new ProxyThreadSubscriber('ck', 123)
	})

	it('should initialise with an empty set of ids', () => {
		let ThreadSubscriber = require('../../src/api/thread-subscriber')
		let subscriber = new ThreadSubscriber('ck', 123)

		assert(subscriber._ids && subscriber._ids.length === 0)
	})

	it('should initialise the Chan api with https if specified', () => {
		let apiSpy = sinon.spy(class MockApi {
			constructor() { }
		})

		// Inject the stub into the subscriber
		let ProxyThreadSubscriber = proxyquire('../../src/api/thread-subscriber', {
			'./api': apiSpy
		})

		new ProxyThreadSubscriber('ck', 123, true)

		assert(apiSpy.calledWithExactly(true))
	})

	it('should call api with specified board and thread', (done) => {
		fetchStub.returns(Promise.resolve())

		subscriber.next()
			.then(() => {
				assert(fetchStub.calledOnce)
				assert(fetchStub.calledWithExactly('ck', 123))
			})
			.then(() => done())
			.catch(done)
	})

	it('should store new ids and supply all new posts after the first successful call', (done) => {
		// Stub the api class
		fetchStub.returns(Promise.resolve({
			posts: [
				{ no: 0 },
				{ no: 1 },
				{ no: 2 },
				{ no: 3 },
				{ no: 4 },
				{ no: 5 }
			]
		}))

		subscriber.next()
			.then((data) => {
				// Check the ids are stored on the subscriber
				assert.equal(6, subscriber._ids.length)
				Array.from(Array(6)
					.keys())
					.forEach(i => assert(
						subscriber._ids.findIndex(id => id === i) > -1)
					)

				// Check the data
				let expected =  [ 
					{ no: 0 }, 
					{ no: 1 }, 
					{ no: 2 }, 
					{ no: 3 }, 
					{ no: 4 }, 
					{ no: 5 },
				]
				assert.deepStrictEqual(data, expected)
			})
			.then(() => done())
			.catch(done)
	})

	it('shouldn\'t update ids or pass any data if a consecutive call returns nothing', (done) => {
		fetchStub.onFirstCall()
			.returns(Promise.resolve({
				posts: [
					{ no: 0 },
					{ no: 1 },
					{ no: 2 }
				]
			}))

		fetchStub.onSecondCall()
			.returns(Promise.resolve())

		subscriber.next()
			.then(() => subscriber.next())
			.then((data) => {
				// Check the ids remain on the subscriber
				assert.equal(3, subscriber._ids.length)
				Array.from(Array(3)
					.keys())
					.forEach(i => assert(
						subscriber._ids.findIndex(id => id === i) > -1)
					)

				// Check the data
				assert(!data)
			})
			.then(() => done())
			.catch(done)
	})

	it('should return undefined if threads were retrieved but nothing has changed', (done) => {
		fetchStub.onFirstCall()
			.returns(Promise.resolve({
				posts: [
					{ no: 1 },
					{ no: 2 },
					{ no: 3 }
				]
			}))

		fetchStub.onSecondCall()
			.returns(Promise.resolve({
				posts: [
					{ no: 1 },
					{ no: 2 },
					{ no: 3 }
				]
			}))

		subscriber.next()
			.then(() => subscriber.next())
			.then((data) => {
				// Check the data
				assert(!data)
			})
			.then(() => done())
			.catch(done)
	})

	it('updates ids and passes only new posts if a consecutive call returns new posts', (done) => {
		fetchStub.onFirstCall()
			.returns(Promise.resolve({
				posts: [
					{ no: 0 },
					{ no: 1 },
					{ no: 2 },
					{ no: 3 }
				]
			}))

		fetchStub.onSecondCall()
			.returns(Promise.resolve({
				posts: [
					{ no: 4 },
					{ no: 5 }
				]
			}))

		subscriber.next()
			.then(() => subscriber.next())
			.then(data => {
				// Check the ids are updated on the subscriber
				assert.equal(2, subscriber._ids.length)
				assert(subscriber._ids.indexOf(4) > -1)
				assert(subscriber._ids.indexOf(5) > -1)

				// Check the data
				let expected =  [ 
					{ no: 4 }, 
					{ no: 5 },
				]
				assert.deepStrictEqual(data, expected)
			})
			.then(() => done())
			.catch(done)
	})
})