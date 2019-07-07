let assert = require('assert')
let nock = require('nock')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let Api = require('../src/api')

describe('4chan api', () => {
	let api
	const url = 'http://a.4cdn.org'

	beforeEach(() => {
		api = new Api()
	})

	afterEach(() => {
		nock.cleanAll()
	})	

	it('should use board and thread to call url builder', (done) => {
		let fake = sinon.fake(() => url)		
		let ProxyApi = proxyquire('../src/api', { './url-builder': fake })

		let proxyApi = new ProxyApi()
		
		nock(url)
			.get('/')
			.reply(200, {})

		proxyApi.fetch('a', 'b')
			.then(() => {
				assert(fake.callCount === 1)
				assert(fake.calledWith('a', 'b'))
			})
			.then(() => done())
	})

	it('should add If-Modified-Since epoch header on first request', (done) => {		
		nock(url, {
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/')
			.reply(200, {})

		api.fetch()
			.then(() => done())
			.catch(done)
	})

	it('should add updated If-Modified-Since header on second request', (done) => {		
		// If-Modified-Since header doesnt use s/ms so remove these from our timer
		let startDate = new Date()
			.setSeconds(0, 0)

		// Req 1
		nock(url)		
			.get('/')
			.reply(200, {})

		// Req 2	
		nock(url, {
			reqheaders: {
				'If-Modified-Since': header => {
					let date = new Date(header)
					return date >= startDate
				}
			}
		})		
			.get('/')
			.reply(200, {})

		api.fetch()
			.then(() => api.fetch())
			.then(() => done())
			.catch(done)
	})

	it('should not have a lastRequestDate value on creation', () => {
		assert(!api.lastRequestDate)
	})

	it('should update lastRequestDate after a call has been made', (done) => {
		nock(url)
			.get('/')
			.reply(200, {})

		let currDate = new Date()

		api.fetch()
			.then(() => assert(api.lastRequestDate >= currDate))
			.then(() => done())
			.catch(e => assert.fail(e))
	})

	it('should update lastRequestDate when a Not Modified is returned', (done) => {
		nock(url)
			.get('/')
			.reply(304)

		let currDate = new Date()

		api.fetch()
			.then(() => assert(api.lastRequestDate >= currDate))
			.then(() => done())
			.catch(done)
	})

	it('should update lastRequestDate, then throw, when a Not Found is returned', (done) => {
		nock(url)
			.get('/')
			.reply(404)

		let currDate = new Date()

		api.fetch()
			.catch(() => assert(api.lastRequestDate >= currDate))
			.then(() => done())
	})

	it('should not update lastRequestDate, then throw, when a server error is returned', (done) => {
		nock(url)
			.get('/')
			.reply(500)

		api.fetch()
			.catch(() => assert(!api.lastRequestDate))
			.then(() => done())
	})
})