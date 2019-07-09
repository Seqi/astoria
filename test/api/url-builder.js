let assert = require('assert')
let urlBuilder = require('../../src/api/url-builder')

describe('URL builder', () => {
	it('should give base http url with no arguments', () => {
		let url = urlBuilder()

		assert.equal('http://a.4cdn.org', url)
	})
	
	it('should give base https url with usehttps flag', () => {
		let url = urlBuilder(null, null, true)

		assert.equal('https://a.4cdn.org', url)
	})
	
	it('should give board catalog url with board only argument', () => {
		let url = urlBuilder('ck')

		assert.equal('http://a.4cdn.org/ck/catalog.json', url)
	})
	
	it('should give thread url with board and thread arguments', () => {
		let url = urlBuilder('ck', 1234)

		assert.equal('http://a.4cdn.org/ck/thread/1234.json', url)
	})
})