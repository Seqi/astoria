# Astoria
[![Build Status](https://travis-ci.com/Seqi/astoria.svg?branch=master)](https://travis-ci.com/Seqi/astoria)

Astoria is a Node.js 4chan board and thread monitor, useful for programatically keeping track of threads on a particular board, or posts in a particular thread, perfect for writing custom bots and scripts. Astoria makes use of, and aims to follow the guidelines of the [4chan API](https://github.com/4chan/4chan-API).

## Installation :hammer:

Add Astoria to your project by installing via `npm`.

`npm install -S astoria`

## Usage :coffee:

Create a new instance of Astoria:

```
let Astoria = require('astoria')

let astoria = new Astoria([options])
```

### Options :wrench:

The Astoria client can be configured by passing an options object into the constructor with any of the following options.

| Option	| Type   | Description				| Default
| ---		| ---	 | ---------					| ---
| interval	| number | Interval between thread/board polling in **seconds**. [Please be respectful to the server and don't set this below 10 seconds!](https://github.com/4chan/4chan-API#api-rules) | 30
| updatesOnly | boolean | If set to true, when listening to a board/thread, only new threads/posts will be sent. Otherwise all current threads/posts will be sent immediately. | false
| unsubscribeOnNotFound | boolean | Whether to automatically stop listening if/when a board/thread returns 404 | true
| useHttps | boolean | Connect to the 4chan API using HTTPS. [Only use this if you're using this with an application that also uses HTTPS](https://github.com/4chan/4chan-API#api-rules). | false

### Examples :balloon:

- Check the __/tv/__ board for any new threads that get posted, every 5 minutes, and log out its id. 

```
let astoria = new Astoria({
	interval: 60 * 5, // 5 mins
	updatesOnly: true // We're only interested in threads posted from now
})

astoria.board('tv')
	.listen((context, threads, err) {
		if (err) {
			return console.log(err)
		}

		threads.forEach(thread => console.log('New thread posted: ', thread.no))
	})
```

- Load a __/ck/__ thread and stop listening once we've loaded all current replies, logging out their id. 

```

let astoria = new Astoria()

let unsubscribe = astoria.board('ck')
	.thread('11444231')
	.listen((context, posts, err) {
		if (err) {
			return console.log(err)
		}

		posts.forEach(thread => console.log('Post: ', post.no))

		// Stop listening
		unsubscribe()
	})
```

### API :link:

The following members exist on the Astoria client.

### `.options`
The currently set options on the client. It is generally not recommended to overwrite these, but this property is available if needed.

### `.board(boardName): Astoria`

Sets the board to listen to. This can be in a format such as `/ck/` or `ck`. A board is required before the listener can begin. 

Returns the current instance to allow method chaining.

##### Examples

`astoria.board('/tv/')`
`astoria.board('v')`

### `.thread(threadNumber): Astoria`

Sets the thread to listen to. This can either be in the format `12345678` or `'12345678'`. Additionally, if you wish to use an existing client which currently has a thread set, you can clear the thread by passing in `null`. 

Returns the current instance to allow method chaining.

##### Examples
`astoria.thread(55555555)`
`astoria.thread('11115512')`

### `.listen(function (context, updates, error)): function`

Begin listening to the board (and thread) supplied to the client, based on the current options configuration. The listener creates a snapshot of this configuration, so if any of these values change after this method is called, it won't affect the listener.

Whenever new data is retrieved from 4chan, the callback will be invoked with the three arguments `context`, `updates` and `error` (described below).

**Returns a function to unsubscribe from the listener. To stop listening to the board/thread, simply invoke the function.**


#### `context`
##### `context.board` 

The board the listener is attached to. e.g. `/g/`, `/an/`

##### `context.thread`

The thread the listener is attached to. e.g. `123512321`, `undefined`

##### `context.options`

The options the listener is using. e.g. ` { interval: 30, useHttps: true, updatesOnly: true, unsubscribeOnNotFound: true }`

#### `updates`

An array of new **threads** or **posts**. No matter what is being subscribed to, the following properties are available (if present) (with one exception). For example, the first post in a thread will also contain information about the thread, such as reply number, etc. (Table taken from [4chan API](https://github.com/4chan/4chan-API))


| **attribute**   | **value**      | **description**      | **possible values**                        | **example value**     |
|:----------------|:---------------|:---------------------|:-------------------------------------------|:----------------------|
| `no`            | `integer`      | Post number          | 1-9999999999999                            | `9001`                |
| `resto`         | `integer`      | Reply to             | 0 (is a thread OP), 1-9999999999999        | `0`                   |
| `sticky`        | `integer`      | Stickied thread?     | 0 (no), 1 (yes)                            | `1`                   |
| `closed`        | `integer`      | Closed thread?       | 0 (no), 1 (yes)                            | `1`                   |
| `archived`      | `integer`      | Archived thread?     | 0 (no), 1 (yes)                            | `1`                   |
| `archived_on`      | `integer`      | Time when archived     | UNIX timestamp                            | `1344571233`                   |
| `now`           | `string`       | Date and time        | MM\/DD\/YY(Day)HH:MM (:SS on some boards), EST/EDT timezone  | `08\/08\/12(Wed)01:11`|
| `time`          | `integer`      | UNIX timestamp       | UNIX timestamp                             | `1344570123`          |
| `name`          | `string`       | Name                 | text                                       | `moot`                |
| `trip`          | `string`       | Tripcode             | text (format: !tripcode!!securetripcode)   | `!Ep8pui8Vw2`         |
| `id`            | `string`       | ID                   | text (8 characters), Mod, Admin, Manager, Developer, Founder | `Admin`               |
| `capcode`       | `string`       | Capcode              | none, mod, admin, admin_highlight, manager, developer, founder | `admin`             |
| `country`       | `string`       | Country code         | text (2 characters, ISO 3166-1 alpha-2), XX (unknown) | `XX`       |
| `country_name`  | `string`       | Country name         | text                                       | `Unknown`             |
| `sub`           | `string`       | Subject              | text                                       | `This is a subject`   |
| `com`           | `string`       | Comment              | text (includes escaped HTML)               | `This is a comment`   |
| `tim`           | `integer`      | Renamed filename     | UNIX timestamp + milliseconds              | `1344402680740`       |
| `filename`      | `string`       | Original filename    | text                                       | `OPisa`               |
| `ext`           | `string`       | File extension       | .jpg, .png, .gif, .pdf, .swf, .webm        | `.jpg`                |
| `fsize`         | `integer`      | File size            | 0-10485760                                 | `2500`                |
| `md5`           | `string`       | File MD5             | text (24 character, packed base64 MD5 hash)| `NOetrLVnES3jUn1x5ZPVAg==` |
| `w`             | `integer`      | Image width          | 1-10000                                    | `500`                 |
| `h`             | `integer`      | Image height         | 1-10000                                    | `500`                 |
| `tn_w`          | `integer`      | Thumbnail width      | 1-250                                      | `250`                 |
| `tn_h`          | `integer`      | Thumbnail height     | 1-250                                      | `250`                 |
| `filedeleted`   | `integer`      | File deleted?        | 0 (no), 1 (yes)                            | `0`                   |
| `spoiler`       | `integer`      | Spoiler image?       | 0 (no), 1 (yes)                            | `0`                   |
| `custom_spoiler`| `integer`      | Custom spoilers?     | 1-99                                       | `3`                   |
| `omitted_posts` | `integer`      | # replies omitted    | 1-10000                                    | `33`                  |
| `omitted_images`| `integer`      | # image replies omitted | 1-10000                                 | `21`                  |
| `replies`       | `integer`      | # replies total      | 0-99999                                    | `231`                 |
| `images`        | `integer`      | # images total       | 0-99999                                    | `132`                 |
| `bumplimit`     | `integer`      | Bump limit met?      | 0 (no), 1 (yes)                            | `0`                   |
| `imagelimit`    | `integer`      | Image limit met?     | 0 (no), 1 (yes)                            | `1`                   |
| `capcode_replies` | `array`      | Capcode user replies?| array of capcode type and post IDs         | `{"admin":[1234,1267]}` |
| `last_modified` | `integer`      | Time when last modified | UNIX timestamp                          | `1344571233`          |
| `tag`           | `string`       | Thread tag           | text                                       | `Loop`                |
| `semantic_url`  | `string`       | Thread URL slug      | text                                       | `daily-programming-thread` |
| `since4pass`    | `integer`      | Year 4chan Pass bought | 4 digit year (YYYY)                      | `2016`                |

The exception being when subscribing to threads, each thread will have the following `last_replies` property on it. 

| **attribute**   | **value**      | **description**      | **possible values**                        | **example value**     |
|:----------------|:---------------|:---------------------|:-------------------------------------------|:----------------------|
| `last_replies`            | `array`      | The latest replies on the thread         | array of post objects (see above)                          | `[ { "no": 3214132, "com": "Im too big for this table" } ]`                |

#### `error`

If an error occurred, this will contain an error object. Errors can include 404, to notify when threads have fallen off the catalog. 

## Contributing :gift:

This project is open to contributions. Please raise an issue before making a contribution. Additionally, please feel free to raise an issue if you find one. For each addition, please add an appropriate test.

## License :zzz:
[MIT](https://choosealicense.com/licenses/mit/)

## Futher reference :book:

Please read the [4chan API documentation](https://github.com/4chan/4chan-API) for further information. 
