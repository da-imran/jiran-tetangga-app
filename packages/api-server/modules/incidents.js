const mongo = require('../utilities/mongodb');
const { requiredCheck } = require('../utilities/validation');
const { logger, LOG_LEVELS } = require('../utilities/logger');
const { MODULES, METHODS } = require('../utilities/constants');
const { v4: uuidv4 } = require('uuid');

module.exports = (app, config) => {
	const { mongoClient } = config;
	const ROUTE_PREPEND = process.env.ROUTE_PREPEND;
	const VERSION = process.env.VERSION;
	const SERVICE_NAME = process.env.SERVICE_NAME;
	const MODULE = MODULES.INCIDENTS;

	// Get All Incidents API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/incidents`, async (req, res) => {
		// #swagger.tags = ['incidents']
		// #swagger.summary = 'Get all incidents'
		// #swagger.description = 'Retrieve all incidents with optional filtering and search support'
		const traceId = uuidv4();
		const apiName = 'Get All Incidents API';

		console.log(`${apiName} is called at ${new Date()}`);
		logger.log({
			service: SERVICE_NAME,
			module: MODULE,
			apiName,
			method: METHODS.GET,
			status: 200,
			message: `${apiName} is called at ${new Date()}`,
			traceId,
			level: LOG_LEVELS.INFO,
		});

		try {
			const {
				pageNumber = 1,
				dataPerPage = 20,
				search,
				filters,
				type,
				severity,
			} = req.query;

			if (!Number.isInteger(+pageNumber) || +pageNumber <= 0) {
				console.log(`${apiName} Bad Request: Invalid page number`);
				res.status(400).send({
					status: 400,
					message: 'Bad Request: Invalid page number',
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 400,
					message: 'Bad Request: Invalid page number',
					traceId,
					level: LOG_LEVELS.ERROR,
				});
			} else if (!Number.isInteger(+dataPerPage) || +dataPerPage <= 0 || +dataPerPage > 100) {
				console.log(`${apiName} Bad Request: Invalid number of data per page`);
				res.status(400).send({
					status: 400,
					message: 'Bad Request: Invalid number of data per page',
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 400,
					message: 'Bad Request: Invalid number of data per page',
					traceId,
					level: LOG_LEVELS.ERROR,
				});
			} 

			const matchStage = {};

			if (search && search.trim() !== '') {
				const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				matchStage.$or = [
					{ title: { $regex: safeSearch, $options: 'i' } },
					{ description: { $regex: safeSearch, $options: 'i' } },
				];
			}

			if (typeof type === 'string' && type.trim() !== '') {
				const typeArray = type.split(',').map(t => t.trim());
				matchStage.type = { $in: typeArray };
			}

			if (typeof severity === 'string' && severity.trim() !== '') {
				matchStage.severity = severity;
			}

			if (typeof filters === 'string' && filters.trim() !== '') {
				const filterArray = filters.split(',').map(f => f.trim());
				matchStage.status = { $in: filterArray };
			}

			const aggregation = [
				{ $match: matchStage },
				{ $sort: { createdAt: -1 } },
				{ $skip: (+pageNumber - 1) * (+dataPerPage) },
				{ $limit: +dataPerPage },
				{
					$project: {
						title: 1,
						description: 1,
						type: 1,
						severity: 1,
						lat: 1,
						lng: 1,
						reports: 1,
						status: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				}
			];

			const countPipeline = [{ $match: matchStage }, { $count: 'total' }];
			const [countResult, incidentResult] = await Promise.all([
				mongo.aggregate(mongoClient, MODULE, countPipeline),
				mongo.aggregate(mongoClient, MODULE, aggregation)
			]);
			const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;

			console.log(`${apiName} Response Success.`);

			res.status(200).send({
				status: 200,
				data: incidentResult || [],
				total: totalCount
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Response Success',
				data: incidentResult || [],
				traceId,
				level: LOG_LEVELS.INFO,
			});
		} catch (err) {
			const error = { message: err.message, stack: err.stack };
			res.status(500).send({
				status: 500,
				message: `${apiName} error`,
				error,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 500,
				message: error,
				traceId,
				level: LOG_LEVELS.ERROR,
			});
		}
	});

	// Get Incident by incidentId API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/incident/:incidentId`, async (req, res) => {
		// #swagger.tags = ['incidents']
		// #swagger.summary = 'Get incident by ID'
		// #swagger.description = 'Retrieve a specific incident by its ID'
		const traceId = uuidv4();
		const apiName = 'Get Incident API';
		const { incidentId } = req.params;

		console.log(`${apiName} is called at ${new Date()}`);
		logger.log({
			service: SERVICE_NAME,
			module: MODULE,
			apiName,
			method: METHODS.GET,
			status: 200,
			message: `${apiName} is called at ${new Date()}`,
			traceId,
			level: LOG_LEVELS.INFO,
		});

		try {
			const requiredFields = [
				'incidentId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			}

			const incidentResult = await mongo.findOne(mongoClient, MODULE, { _id: mongo.getObjectId(incidentId) });
			if (!incidentResult) {
				console.log(`${apiName} failed to fetch the incident. Incident not found.`);
				res.status(404).send({
					status: 404,
					message: 'Incident not found',
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 404,
					message: 'Incident not found',
					traceId,
					level: LOG_LEVELS.ERROR,
				});
				return;
			}

			console.log(`${apiName} Response Success.`);
			res.status(200).send({
				status: 200,
				data: incidentResult
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Response Success',
				data: incidentResult,
				traceId,
				level: LOG_LEVELS.INFO,
			});
		} catch (err) {
			const error = { message: err.message, stack: err.stack };
			res.status(500).send({
				status: 500,
				message: `${apiName} error`,
				error,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 500,
				message: error,
				traceId,
				level: LOG_LEVELS.ERROR,
			});
		}
	});

	// Create Incident API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/incident`, async (req, res) => {
		// #swagger.tags = ['incidents']
		// #swagger.summary = 'Create a new incident'
		// #swagger.description = 'Create a new incident report with details and location'
		const traceId = uuidv4();
		const apiName = 'Create Incident API';
		const {
			title,
			description,
			type,
			severity,
			lat,
			lng,
		} = req.body;

		console.log(`${apiName} is called at ${new Date()}`);
		logger.log({
			service: SERVICE_NAME,
			module: MODULE,
			apiName,
			method: METHODS.POST,
			status: 200,
			message: `${apiName} is called at ${new Date()}`,
			traceId,
			level: LOG_LEVELS.INFO,
		});

		try {
			const requiredFields = [
				'title',
				'description',
				'type',
				'severity',
				'lat',
				'lng',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, config)) {
				return;
			}

			const validTypes = ['pothole', 'flood', 'streetlight', 'crime', 'traffic'];
			if (!validTypes.includes(type)) {
				res.status(400).send({
					status: 400,
					message: 'Bad request: invalid type value',
				});
				return;
			}

			const validSeverities = ['low', 'medium', 'high'];
			if (!validSeverities.includes(severity)) {
				res.status(400).send({
					status: 400,
					message: 'Bad request: invalid severity value',
				});
				return;
			}

			if (typeof lat !== 'number' || typeof lng !== 'number') {
				res.status(400).send({
					status: 400,
					message: 'Bad request: lat and lng must be numbers',
				});
				return;
			}

			const inputIncident = {
				title,
				description,
				type,
				severity,
				lat,
				lng,
				reports: 1,
				status: 'pending',
				createdAt: new Date(),
			};
			const inputResult = await mongo.insertOne(mongoClient, MODULE, inputIncident);
			if (!inputResult) {
				console.error('Error creating Incident.');
				res.status(500).send({
					status: 500,
					message: 'Error creating Incident.',
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 500,
					message: 'Error creating Incident.',
					data: inputResult,
					traceId,
					level: LOG_LEVELS.ERROR,
				});
			}

			console.log(`${apiName} MongoDB Success.`);
			res.status(200).json({
				message: 'Incident created successfully',
				_id: inputResult.insertedId,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Incident created successfully',
				data: inputResult,
				traceId,
				level: LOG_LEVELS.INFO,
			});
		} catch (err) {
			const error = { message: err.message, stack: err.stack };
			res.status(500).send({
				status: 500,
				message: `${apiName} error`,
				error,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 500,
				message: error,
				traceId,
				level: LOG_LEVELS.ERROR,
			});
		}
	});

	// Update Incident by incidentId API
	app.patch(`/${ROUTE_PREPEND}/${VERSION}/incident/:incidentId`, async (req, res) => {
		// #swagger.tags = ['incidents']
		// #swagger.summary = 'Update an incident'
		// #swagger.description = 'Update an existing incident details by its ID'
		const traceId = uuidv4();
		const apiName = 'Update Incident API';
		const { incidentId } = req.params;
		const {
			title,
			description,
			type,
			severity,
			lat,
			lng,
			status,
		} = req.body;

		console.log(`${apiName} is called at ${new Date()}`);
		logger.log({
			service: SERVICE_NAME,
			module: MODULE,
			apiName,
			method: METHODS.PATCH,
			status: 200,
			message: `${apiName} is called at ${new Date()}`,
			traceId,
			level: LOG_LEVELS.INFO,
		});

		try {
			const requiredFields = [
				'incidentId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			}

			const updateObj = {};
			if (title) updateObj.title = title;
			if (description) updateObj.description = description;
			if (type) updateObj.type = type;
			if (severity) updateObj.severity = severity;
			if (lat !== undefined) updateObj.lat = lat;
			if (lng !== undefined) updateObj.lng = lng;
			if (status) updateObj.status = status;
			updateObj.updatedAt = new Date();

			const updateResult = await mongo.findOneAndUpdate(mongoClient, MODULE, { _id: mongo.getObjectId(incidentId) }, updateObj);
			if (!updateResult) {
				res.status(500).send({
					status: 500,
					message: 'Incident not updated'
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 500,
					message: 'Incident not updated',
					data: updateResult,
					traceId,
					level: LOG_LEVELS.ERROR,
				});
			}

			res.status(200).send({
				status: 200,
				message: 'Incident updated successfully.',
				data: JSON.parse(JSON.stringify(updateResult)),
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Incident updated successfully.',
				data: updateResult,
				traceId,
				level: LOG_LEVELS.INFO,
			});
		} catch (err) {
			const error = { message: err.message, stack: err.stack };
			res.status(500).send({
				status: 500,
				message: `${apiName} error`,
				error,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 500,
				message: error,
				traceId,
				level: LOG_LEVELS.ERROR,
			});
		}
	});

	// Delete Incident by incidentId API
	app.delete(`/${ROUTE_PREPEND}/${VERSION}/incident/:incidentId`, async (req, res) => {
		// #swagger.tags = ['incidents']
		// #swagger.summary = 'Delete an incident'
		// #swagger.description = 'Delete an existing incident by its ID'
		const traceId = uuidv4();
		const apiName = 'Delete Incident API';
		const { incidentId } = req.params;

		console.log(`${apiName} is called at ${new Date()}`);
		logger.log({
			service: SERVICE_NAME,
			module: MODULE,
			apiName,
			method: METHODS.DELETE,
			status: 200,
			message: `${apiName} is called at ${new Date()}`,
			traceId,
			level: LOG_LEVELS.INFO,
		});

		try {
			const requiredFields = [
				'incidentId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			}

			const deleteResult = await mongo.deleteOne(mongoClient, MODULE, { _id: mongo.getObjectId(incidentId) });
			if (!deleteResult) {
				res.status(500).send({
					status: 500,
					message: 'Incident not deleted'
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 500,
					message: 'Incident not deleted',
					traceId,
					level: LOG_LEVELS.ERROR,
				});
			}
				
			res.status(200).send({
				status: 200,
				message: 'Incident deleted successfully.',
				data: {
					incident: deleteResult
				},
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Incident deleted successfully.',
				data: deleteResult,
				traceId,
				level: LOG_LEVELS.INFO,
			});
		} catch (err) {
			const error = { message: err.message, stack: err.stack };
			res.status(500).send({
				status: 500,
				message: `${apiName} error`,
				error,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 500,
				message: error,
				traceId,
				level: LOG_LEVELS.ERROR,
			});
		}
	});

	// Report/Upvote Incident API (increment report count)
	app.post(`/${ROUTE_PREPEND}/${VERSION}/incident/:incidentId/report`, async (req, res) => {
		// #swagger.tags = ['incidents']
		// #swagger.summary = 'Report/Upvote an incident'
		// #swagger.description = 'Increment the report count for an incident, indicating more residents have observed it'
		const traceId = uuidv4();
		const apiName = 'Report Incident API';
		const { incidentId } = req.params;

		console.log(`${apiName} is called at ${new Date()}`);
		logger.log({
			service: SERVICE_NAME,
			module: MODULE,
			apiName,
			method: METHODS.POST,
			status: 200,
			message: `${apiName} is called at ${new Date()}`,
			traceId,
			level: LOG_LEVELS.INFO,
		});

		try {
			const requiredFields = [
				'incidentId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			}

			const updateResult = await mongo.findOneAndUpdate(
				mongoClient,
				MODULE,
				{ _id: mongo.getObjectId(incidentId) },
				{ $inc: { reports: 1 }, updatedAt: new Date() }
			);
			if (!updateResult) {
				res.status(500).send({
					status: 500,
					message: 'Incident not updated'
				});

				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 500,
					message: 'Incident not updated',
					data: updateResult,
					traceId,
					level: LOG_LEVELS.ERROR,
				});
			}

			res.status(200).send({
				status: 200,
				message: 'Incident reported successfully.',
				data: JSON.parse(JSON.stringify(updateResult)),
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Incident reported successfully.',
				data: updateResult,
				traceId,
				level: LOG_LEVELS.INFO,
			});
		} catch (err) {
			const error = { message: err.message, stack: err.stack };
			res.status(500).send({
				status: 500,
				message: `${apiName} error`,
				error,
			});

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 500,
				message: error,
				traceId,
				level: LOG_LEVELS.ERROR,
			});
		}
	});
};
