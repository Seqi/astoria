let fetch = require('node-fetch')
let urlBuilder = require('./url-builder')

class ChanApi {
	constructor(useHttps) {
		this.useHttps = useHttps
	}

	fetch(board, thread) {
		let url = urlBuilder(board, thread, this.useHttps)

		let headers = {
			'If-Modified-Since': (this.lastRequestDate || new Date(0)).toUTCString()
		}

		// Getting If-Modified-By working with a to-the-second value has proven
		// to be a giant pain in the ass. Not sure if it's due to local and server
		// clocks being out of sync. 
		// As a 'fuck it', but still being kinda respectful to the server, knock off
		// 30 seconds from the last request. This will only affect quicker polls anyway
		let thisRequestDate = new Date()
		thisRequestDate.setSeconds(thisRequestDate.getSeconds() - 30)
		
		return fetch(url, { headers })
			.then(res => {
				if (res.ok || res.status === 304) {
					this.lastRequestDate = thisRequestDate
					return res
				}
				if (res.status === 404) {
					this.lastRequestDate = thisRequestDate
					throw new Error('not found')
				}
				throw new Error(res.statusText)
			})
			.then(res => res.status === 304 ? null : res.json())
	}
}

module.exports = ChanApi