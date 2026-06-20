/**
 * Swagger JSDoc configuration
 * Reads JSDoc @swagger comments from route files
 */
require('dotenv').config();

const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = process.env.PORT || '3500';
const ROUTE_PREPEND = process.env.ROUTE_PREPEND || 'jiran-tetangga';
const VERSION = process.env.VERSION || 'v1';

const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Jiran Tetangga API',
			description: 'API Documentation',
			version: '1.0.0'
		},
		servers: [
			{
				url: `http://${HOSTNAME}:${PORT}/${ROUTE_PREPEND}/${VERSION}`,
				description: 'API Server'
			}
		],
		components: {
			securitySchemes: {
				apiKeyAuth: {
					type: 'apiKey',
					in: 'header',
					name: 'x-api-key',
					description: 'API Key required to access the documentation'
				}
			}
		},
		security: [
			{
				apiKeyAuth: []
			}
		]
	},
	apis: [
		'./modules/*.js',
		'./middleware/*.js',
		'./index.js',
		'./app.js'
	]
};

module.exports = swaggerOptions;
