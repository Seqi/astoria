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
		
		return fetch(url, { headers })
			.then(res => {
				if (res.ok || res.status === 304) {
					this.lastRequestDate = new Date()
					return res
				}
				if (res.status === 404) {
					this.lastRequestDate = new Date()
					throw new Error('not found')
				}
				throw new Error(res.statusText)
			})
			.then(res => res.status === 304 ? null : res.json())
	}
}

module.exports = ChanApi