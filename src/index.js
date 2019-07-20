let Poller = require('./poller')
let subscriber = require('./api/subscriber')

function areOptionsValid(opts) {
	if (!opts || typeof opts !== 'object') {
		return false
	}

	if ((opts.interval && typeof opts.interval !== 'number') ||
		(opts.updatesOnly && typeof opts.updatesOnly !== 'boolean') ||
		(opts.unsubscribeOnNotFound && typeof opts.unsubscribeOnNotFound !== 'boolean') ||
		(opts.useHttps && typeof opts.useHttps !== 'boolean')) {
		return false
	}

	return true
}

/**
  * A 4chan board and thread listener.
  */
class Astoria {
	/**
	  * @param {AstoriaOptions} options The configuration for Astoria
	  */
	constructor(options) {
		if (options !== null && options !== undefined && !areOptionsValid(options)) {
			throw new Error('Options are not valid.')
		}

		let defaultOptions = {
			interval: 30,
			updatesOnly: false,
			unsubscribeOnNotFound: true,
			useHttps: false
		}

		/**
		 * The current options set being used.
		 * @type {AstoriaOptions} options
		 */
		this.options = {
			...defaultOptions,
			...options || {}
		}
	}

	/**
	 * Sets the target board.
	 * @param {string} board The 4chan board to target e.g. (v, ck, /biz/, /an/)
	 * @return {Astoria} Current instance of Astoria
	 */
	board(board) {
		this._board = board.replace(/\//g, '')
		return this
	}

	/**
	 * Sets the target thread.
	 * @param {string} thread The thread number to target (e.g. '1234567')
	 * @return {Astoria} Current instance of Astoria
	 */
	thread(thread) {
		this._thread = thread
		return this
	}

	/**
	 * Begin listening to the specified board/thread. 
	 * @param {AstoriaResponse} callback The behaviour to trigger when updates are received.
	 * @return {function} A function which unsubscribes from the listener when called.
	 */
	listen(callback) {
		if (!areOptionsValid(this.options)) {
			throw new Error('Options are not valid.')
		}

		// Keep local reference of instance vars to prevent overwrites
		let ctx = {
			board: this._board,
			thread: this._thread,
			options: this.options,		
		}

		if (!callback || typeof callback !== 'function') {
			throw new Error('Callback must be a function')
		}

		if (!ctx.board) {
			throw new Error('A board must be specified')
		}

		let currentSubscriber = subscriber.getSubscriber(ctx.board, ctx.thread, ctx.options.useHttps)
		let poller = new Poller(ctx.options.interval)

		// Little hack if they cancel the listener before actually listening
		let isCancelled = false

		// Get initial set of data and send it back to the user if requested
		currentSubscriber.next()
			.then(
				data => !ctx.options.updatesOnly && callback(ctx, data), 
				err => {
					if (err.message === 'not found' && ctx.options.unsubscribeOnNotFound) {
						// Poller won't have polled yet so we can just set the flag
						isCancelled = true
					}

					callback(ctx, null, err)
				}
			)
			// Then begin polling for new items
			.then(() => {
				if (isCancelled) {
					return
				}

				poller.onPoll(() => {
					return currentSubscriber.next()
						.then(
							data => data && callback(ctx, data),
							err => {
								if (err.message === 'not found' && ctx.options.unsubscribeOnNotFound) {
									poller.cancel()
								}
			
								callback(ctx, null, err)
							}
						)
				})

				poller.poll()
			})

		// Give the user a way to unsubscribe
		return () => {
			isCancelled = true
			poller.cancel()
		}
	}
}

/**
 * Callback containing new threads/posts.
 * @callback AstoriaResponse
 * @param {AstoriaResponseContext} context The context of the listener, including board, thread and options.
 * @param {Array.<Post>} items New threads/posts since last poll.
 * @param {Error} err Any error that occurred.
 */

/**
  * A 4chan thread/post object.
  * @typedef {Object} Post
  * @property {number} no 			 	Post number          		(1-9999999999999)
  * @property {number} [resto]          Reply to             		(e.g. 0 (is a thread OP), 1-9999999999999)
  * @property {number} [sticky]         Stickied thread	    		(e.g. 0 (no), 1 (yes))
  * @property {number} [closed]         Closed thread       		(e.g. 0 (no), 1 (yes))
  * @property {number} [archived]       Archived thread     		(e.g. 0 (no), 1 (yes))
  * @property {number} [archived_on]    Time when archived   		(UNIX timestamp)
  * @property {string} [now]            Date and time        		(MM\/DD\/YY(Day)HH:MM (:SS on some boards))
  * @property {number} [time]           UNIX timestamp       		
  * @property {string} [name]           Name                 		
  * @property {string} [trip]           Tripcode             		(format: !tripcode!!securetripcode)
  * @property {string} [id]             ID                   		(text (8 characters), Mod, Admin, Manager, Developer, Founder)
  * @property {string} [capcode]        Capcode              		(none, mod, admin, admin_highlight, manager, developer, founder)
  * @property {string} [country]        Country code         		(text (2 characters, ISO 3166-1 alpha-2), XX (unknown))
  * @property {string} [country_name]   Country name         		
  * @property {string} [sub]            Subject              		
  * @property {string} [com]            Comment              		(includes escaped HTML)
  * @property {number} [tim]            Renamed filename     		(UNIX timestamp + milliseconds)
  * @property {string} [filename]       Original filename    		
  * @property {string} [ext]            File extension       		(e.g. .jpg, .png, .gif, .pdf, .swf, .webm)
  * @property {number} [fsize]          File size            		(0-10485760)
  * @property {string} [md5]            File MD5             		(24 character, packed base64 MD5 hash)
  * @property {number} [w]              Image width          		(1-10000)
  * @property {number} [h]              Image height         		(1-10000)
  * @property {number} [tn_w]           Thumbnail width      		(1-250)
  * @property {number} [tn_h]           Thumbnail height     		(1-250)
  * @property {number} [filedeleted]    File deleted        		(e.g. 0 (no), 1 (yes))
  * @property {number} [spoiler]        Spoiler image       		(e.g. 0 (no), 1 (yes))
  * @property {number} [custom_spoiler] Custom spoilers     		(1-99)
  * @property {number} [omitted_posts]  # replies omitted    		(1-10000)
  * @property {number} [omitted_images] # image replies omitted		(1-10000)
  * @property {number} [replies]        # replies total      		(0-99999)
  * @property {number} [images]         # images total       		(0-99999)
  * @property {number} [bumplimit]      Bump limit met      		(e.g. 0 (no), 1 (yes))
  * @property {number} [imagelimit]     Image limit met     		(e.g. 0 (no), 1 (yes))
  * @property {Array} [capcode_replies] Capcode user replies		(array of capcode type and post IDs)
  * @property {number} [last_modified]  Time when last modified		(UNIX timestamp)
  * @property {string} [tag]            Thread tag           		
  * @property {string} [semantic_url]   Thread URL slug      		
  * @property {number} [since4pass]     Year 4chan Pass bought 		(4 digit year (YYYY))
  * @property {Post} [last_replies]		Last 5 replies (thread only)
  */

/**
 * Astoria options
 * @typedef {Object} AstoriaOptions
 * @property {number} [interval] Interval between thread/board polling in **seconds**. Please be 
 * 		respectful to the server and don't set this below 10 seconds! *Defaults to 30 seconds.*
 * @property {boolean} [updatesOnly] If set to true, when listening to a board/thread, only new 
 * 		threads/posts will be sent. Otherwise all current threads/posts will be sent immediately.
 * 		_Defaults to *false*
 * @property {boolean} [unsubscribeOnNotFound] Whether to automatically stop listening if/when a
 * 		board/thread returns 404. *Defaults to true.*
 * @property {boolean} [useHttps] Connect to the 4chan API using HTTPS. Only use this if you're
 * 		using this with an application that also uses HTTPS. *Defaults to false.*
 */

/** 
  * Astoria response context
  * @typedef {Object} AstoriaResponseContext
  * @property {string} board The board currently being listened to.
  * @property {string} thread The thread currently being listened to if applicable.
  * @property {AstoriaOptions} options The options applied to the listener.
  */

module.exports = Astoria