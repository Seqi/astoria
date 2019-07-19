let assert = require('assert')
let nock = require('nock')
let sinon = require('sinon')

let Astoria = require('../src/index')

describe('End to end', () => {
	it('should poll 4chan api for new threads and send new replies back', (done) => {
		let url = 'http://a.4cdn.org'

		// Req One
		nock(url, {
			//Ensure the blank modified header applies
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/ck/catalog.json')
			.reply(200, [
				{
					page: '1',
					threads: [ { no: 1 }, { no: 2 }, { no: 3 } ]
				},
				{
					page: '2',
					threads: [ { no: 4 }, { no: 5 }, { no: 6 } ]
				}
			])

		// Req 2, no updates	
		nock(url, {
			reqheaders: {
				'If-Modified-Since': header => {
					let date = new Date(header)
					return date.getTime() > 0 
				}
			}
		})		
			.get('/ck/catalog.json')
			.reply(200, [
				{
					page: '1',
					threads: [ { no: 1 }, { no: 2 }, { no: 3 } ]
				},
				{
					page: '2',
					threads: [ { no: 4 }, { no: 5 }, { no: 6 } ]
				}
			])

		// Req 3, updates	
		nock(url, {
			reqheaders: {
				'If-Modified-Since': header => {
					let date = new Date(header)
					return date.getTime() > 0 
				}
			}
		})		
			.get('/ck/catalog.json')
			.reply(200, [
				{
					page: '1',
					threads: [ { no: 8 }, { no: 2 }, { no: 3 } ]
				},
				{
					page: '2',
					threads: [ { no: 4 }, { no: 5 }, { no: 6 } ]
				},
				{
					page: '3',
					threads: [ { no: 7 } ]
				}
			])

		let spy = sinon.spy((context, threads, err) => {
			assert.equal('ck', context.board)
			assert(!context.thread)

			if (err) {
				done(err)
			}

			if (spy.callCount === 1) {
				assert.equal(6, threads.length)
			}
			else {
				unsubscribe()

				assert.equal(2, threads.length)
				assert.equal(2, spy.callCount)
				assert(threads.find(t => t.no === 7))
				assert(threads.find(t => t.no === 8))
				done()
			}
		})

		let client = new Astoria({ interval: 0.01 })
		let unsubscribe = client.board('/ck/')
			.listen(spy)
	})

	it('should poll 4chan api for new posts and send new replies back', (done) => {
		let url = 'http://a.4cdn.org'

		// Req One
		nock(url, {
			//Ensure the blank modified header applies
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/ck/thread/12345.json')
			.reply(200, {
				posts: [
					{ no: 1 },
					{ no: 2 },
					{ no: 3 }
				]
			})

		// Req 2, no updates	
		nock(url, {
			reqheaders: {
				'If-Modified-Since': header => {
					let date = new Date(header)
					return date.getTime() > 0 
				}
			}
		})		
			.get('/ck/thread/12345.json')
			.reply(200, {
				posts: [
					{ no: 1 },
					{ no: 2 },
					{ no: 3 }
				]
			})

		// Req 3, updates	
		nock(url, {
			reqheaders: {
				'If-Modified-Since': header => {
					let date = new Date(header)
					return date.getTime() > 0 
				}
			}
		})		
			.get('/ck/thread/12345.json')
			.reply(200, {
				posts: [
					{ no: 1 },
					{ no: 2 },
					{ no: 3 },					
					{ no: 4 },					
					{ no: 5 }
				]
			})

		let spy = sinon.spy((context, posts, err) => {
			assert.equal('ck', context.board)
			assert(12345, !context.thread)
			
			if (err) {
				done(err)
			}

			if (spy.callCount === 1) {
				assert.equal(3, posts.length)
			}
			else {
				unsubscribe()

				assert.equal(2, posts.length)
				assert.equal(2, spy.callCount)
				assert(posts.find(t => t.no === 4))
				assert(posts.find(t => t.no === 5))
				done()
			}
		})

		let client = new Astoria({ interval: 0.01 })
		let unsubscribe = client.board('/ck/')
			.thread(12345)
			.listen(spy)
	})

	it('should poll 4chan api for new threads using HTTPS if requested ', (done) => {
		let url = 'https://a.4cdn.org'

		// Req One
		let scope = nock(url, {
			//Ensure the blank modified header applies
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/ck/catalog.json')
			.reply(304)

		let client = new Astoria({ interval: 0.01, useHttps: true })
		let unsubscribe = client.board('/ck/')
			.listen((context, threads, err) => {
				unsubscribe()

				if (err) {
					done(err)
				}

				assert(scope.isDone())
				done()
			})
	})

	it('should poll 4chan api for new posts using HTTPS if requested ', (done) => {
		let url = 'https://a.4cdn.org'

		// Req One
		let scope = nock(url, {
			//Ensure the blank modified header applies
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/ck/thread/12345.json')
			.reply(304)

		let client = new Astoria({ interval: 0.01, useHttps: true })
		let unsubscribe = client.board('/ck/')
			.thread(12345)
			.listen((context, threads, err) => {
				unsubscribe()

				if (err) {
					done(err)
				}

				assert(scope.isDone())
				done()
			})
	})

	it('should not listen if the board is not found', (done) => {
		let url = 'http://a.4cdn.org'

		// Req One
		nock(url, {
			//Ensure the blank modified header applies
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/ck/catalog.json')
			.reply(404)

		let client = new Astoria({ interval: 0.01 })

		let spy = sinon.spy((context, data, err) => {
			if (err) {
				assert.equal(err.message, 'not found')
				assert.equal(spy.callCount, 1)

				// Wait a bit to ensure no more calls happen after this					
				setTimeout(() => {
					assert.equal(spy.callCount, 1)
					done()
				}, 50)
			} 				
		})

		client
			.board('ck')
			.listen(spy)			
	})

	it('should not listen if the thread is not found', (done) => {
		let url = 'http://a.4cdn.org'

		// Req One
		nock(url, {
			//Ensure the blank modified header applies
			reqheaders: {
				'If-Modified-Since': new Date(0)
					.toUTCString()
			}
		})		
			.get('/ck/thread/12345.json')
			.reply(404)

		let client = new Astoria({ interval: 0.01 })

		let spy = sinon.spy((context, data, err) => {
			if (err) {
				assert.equal(err.message, 'not found')
				assert.equal(spy.callCount, 1)

				// Wait a bit to ensure no more calls happen after this					
				setTimeout(() => {
					assert.equal(spy.callCount, 1)
					done()
				}, 50)
			} 				
		})

		client
			.board('ck')
			.thread(12345)
			.listen(spy)			
	})

	it('should stop listening if the thread 404s', (done) => {
		let url = 'http://a.4cdn.org'

		// Req One
		nock(url)		
			.get('/ck/thread/12345.json')
			.reply(200, {
				posts: [
					{ no: 1 },
					{ no: 2 }
				]
			})

		// Req Two
		nock(url)		
			.get('/ck/thread/12345.json')
			.reply(404)

		let client = new Astoria({ interval: 0.01 })

		let spy = sinon.spy((context, data, err) => {
			if (err) {
				assert.equal(err.message, 'not found')
				assert.equal(spy.callCount, 2)

				// Wait a bit to ensure no more calls happen after this					
				setTimeout(() => {
					assert.equal(spy.callCount, 2)
					done()
				}, 50)
			} 				
		})

		client
			.board('ck')
			.thread(12345)
			.listen(spy)			
	})
})