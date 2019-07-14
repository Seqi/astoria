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
		// to be a giant pain in the ass. It seems the server doesn't update the 
		// actual value til upwards of 10-15 seconds after the update has been made. 
		// Therefore, with a rolling If-Modified-Since, we're always 'ahead' of the 
		// server. 
		//
		// For example, we can do the following requests:
		// 		Request - 13:00:00
		//		If-Modified-Since - 12:00:00
		//
		// 		Request - 14:00:00
		//		If-Modified-Since - 13:00:00
		// 
		// If a single post gets made at 12:59:56, the server won't update the 
		// If-Modified-Since for 10~ seconds, and won't come back in the 13:00:00
		// request. And as it's before 13:00:00, it won't come back in the next request
		// either. 
		//
		// We can account for this by giving a 30s~ leeway like so:
		//
		// For example, we can do the following requests:
		// 		Request - 13:00:00
		//		If-Modified-Since - 11:59:30
		//
		// 		Request - 14:00:00
		//		If-Modified-Since - 12:59:30
		// 
		// Now, if the single post at 12:59:56 won't get picked up on the first request,
		// It will now get picked up on the second. 
		// The only downside to this is with shorter poll times, we'll be picking up data
		// we already have even when nothing changes. 

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