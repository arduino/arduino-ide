// @ts-check

const util = require('util');

const TRANSIFEX_ENDPOINT = 'https://rest.api.transifex.com/';

const apiKey = () => {
	const apiKey = process.env.TRANSIFEX_API_KEY;
	if (!apiKey) {
		console.error('missing TRANSIFEX_API_KEY environment variable');
		process.exit(1);
	}
	return apiKey
}

exports.credentials = async () => {
	const organization = process.env.TRANSIFEX_ORGANIZATION;
	const project = process.env.TRANSIFEX_PROJECT;
	const resource = process.env.TRANSIFEX_RESOURCE;

	if (!organization) {
		console.error('missing TRANSIFEX_ORGANIZATION environment variable');
		process.exit(1);
	}

	if (!project) {
		console.error('missing TRANSIFEX_PROJECT environment variable');
		process.exit(1);
	}

	if (!resource) {
		console.error('missing TRANSIFEX_RESOURCE environment variable');
		process.exit(1);
	}

	return { organization, project, resource }
}

exports.url = (path, queryParameters) => {
	let url = util.format('%s%s', TRANSIFEX_ENDPOINT, path);
	if (queryParameters) {
		url = util.format('%s?%s', url, queryParameters);
	}
	return url
}

exports.authHeader = () => {
	return {
		'Authorization': util.format("Bearer %s", apiKey()),
	}
}
