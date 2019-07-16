let assert = require('assert')
let sinon = require('sinon')
let proxyquire = require('proxyquire')

describe('Board subscriber', () => {
	let apiStub
	let fetchStub
	let subscriber

	beforeEach(() => {
		// Stub the api
		fetchStub = sinon.stub()
		apiStub = function () {
			this.fetch = fetchStub
		}

		// Inject the stub into the subscriber
		let ProxyBoardSubscriber = proxyquire('../../src/api/board-subscriber', {
			'./api': apiStub
		})

		subscriber = new ProxyBoardSubscriber('ck')
	})

	it('should initialise with an empty set of ids', () => {
		let BoardSubscriber = require('../../src/api/board-subscriber')
		let subscriber = new BoardSubscriber('ck')

		assert(subscriber._ids && subscriber._ids.length === 0)
	})

	it('should initialise the Chan api with https if specified', () => {
		let apiSpy = sinon.spy(class MockApi {
			constructor() { }
		})

		// Inject the stub into the subscriber
		let ProxyBoardSubscriber = proxyquire('../../src/api/board-subscriber', {
			'./api': apiSpy
		})

		new ProxyBoardSubscriber('ck', true)

		assert(apiSpy.calledWithExactly(true))
	})

	it('should call api with specified board', (done) => {
		fetchStub.returns(Promise.resolve())

		subscriber.next()
			.then(() => {
				assert(fetchStub.calledOnce)
				assert(fetchStub.calledWithExactly('ck'))
			})
			.then(() => done())
			.catch(done)
	})

	it('should store new ids and supply all new threads after the first successful call', (done) => {
		// Stub the api class
		fetchStub.returns(Promise.resolve([
			{
				page: '1',
				threads: [ { no: 0 }, { no: 1 }, { no: 2 } ]
			},
			{
				page: '2',
				threads: [ { no: 3 }, { no: 4 }, { no: 5 } ]
			}
		]))

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
			.returns(Promise.resolve([
				{
					page: '1',
					threads: [ { no: 0 }, { no: 1 }, { no: 2 } ]
				}
			]))

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

	it('should return undefined if boards were retrieved but nothing has changed', (done) => {
		fetchStub.onFirstCall()
			.returns(Promise.resolve([
				{
					page: '1',
					threads: [ { no: 1 }, { no: 2 }, { no: 3 } ]
				}
			]))

		fetchStub.onSecondCall()
			.returns(Promise.resolve([
				{
					page: '1',
					threads: [ { no: 1 }, { no: 2 }, { no: 3 } ]
				}
			]))

		subscriber.next()
			.then(() => subscriber.next())
			.then((data) => {
				// Check the data
				assert(!data)
			})
			.then(() => done())
			.catch(done)
	})

	it('updates ids and passes only new threads if a consecutive call returns new threads', (done) => {
		fetchStub.onFirstCall()
			.returns(Promise.resolve([
				{
					page: '1',
					threads: [ { no: 0 }, { no: 1 }, { no: 2 } ]
				}
			]))

		fetchStub.onSecondCall()
			.returns(Promise.resolve([
				{
					page: '1',
					threads: [ { no: 4 }, { no: 5 } ]
				}
			]))

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