module.exports = (board, thread, useHttps = false) => {
	let baseUrl

	if (useHttps) {
		baseUrl = 'https://a.4cdn.org'
	} else {
		baseUrl = 'http://a.4cdn.org'
	}

	if (board && !thread) {
		baseUrl += `/${board}/catalog.json`
	}
	else if (board && thread) {
		baseUrl += `/${board}/thread/${thread}.json`
	}

	return baseUrl
}