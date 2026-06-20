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
	const MODULE = MODULES.FACILITIES;

	// Get All Facilities API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/facilities`, async (req, res) => {
		// #swagger.tags = ['facilities']
		// #swagger.summary = 'Get all facilities'
		// #swagger.description = 'Retrieve all facilities with pagination and search support'
		const traceId = uuidv4();
		const apiName = 'Get All Facilities API';

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
			// Pagination
			const {
				pageNumber = 1,
				dataPerPage = 20,
				search,
				filters,
			} = req.query;

			if (!Number.isInteger(+pageNumber) || +pageNumber <= 0) {
				console.log(`❌ ${apiName} Bad Request: Invalid page number`);
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
				console.log(`❌ ${apiName} Bad Request: Invalid number of data per page`);
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
			} else {
				const matchStage = {};
				if (search && search.trim() !== '') {
					const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					matchStage.$or = [
						{ name: { $regex: safeSearch, $options: 'i' } },
						{ description: { $regex: safeSearch, $options: 'i' } },
						{ location: { $regex: safeSearch, $options: 'i' } },
					];
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
							name: 1,
							description: 1,
							location: 1,
							capacity: 1,
							status: 1,
							createdAt: 1,
						},
					}
				];

				const countPipeline = [{ $match: matchStage }, { $count: 'total' }];
				const [countResult, facilityResult] = await Promise.all([
					mongo.aggregate(mongoClient, MODULE, countPipeline),
					mongo.aggregate(mongoClient, MODULE, aggregation)
				]);

				// Always return 200 for list endpoints, even if empty


				const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;



				console.log(`${apiName} Response Success.`);


				res.status(200).send({


					status: 200,


					data: facilityResult || [],


					total: totalCount


				});



				logger.log({


					service: SERVICE_NAME,


					module: MODULE,


					apiName,


					status: 200,


					message: 'Response Success',


					data: facilityResult || [],


					traceId,


					level: LOG_LEVELS.INFO,


				});
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

	// Get Facility by facilityId API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/facility/:facilityId`, async (req, res) => {
		// #swagger.tags = ['facilities']
		// #swagger.summary = 'Get facility by ID'
		// #swagger.description = 'Retrieve a specific facility by its ID'
		const traceId = uuidv4();
		const apiName = 'Get Facility API';
		const { facilityId } = req.params;

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
				'facilityId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const facilityResult = await mongo.findOne(mongoClient, MODULE, { _id: mongo.getObjectId(facilityId) });
				// Always return 200 for list endpoints, even if empty

				const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;


				console.log(`${apiName} Response Success.`);

				res.status(200).send({

					status: 200,

					data: facilityResult || [],

					total: totalCount

				});


				logger.log({

					service: SERVICE_NAME,

					module: MODULE,

					apiName,

					status: 200,

					message: 'Response Success',

					data: facilityResult || [],

					traceId,

					level: LOG_LEVELS.INFO,

				});
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

	// Create Facility API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/facility`, async (req, res) => {
		// #swagger.tags = ['facilities']
		// #swagger.summary = 'Create a new facility'
		// #swagger.description = 'Create a new facility with all required details'
		const traceId = uuidv4();
		const apiName = 'Create Facility API';
		const {
			name,
			description,
			location,
			capacity,
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
				'name',
				'description',
				'location',
				'capacity',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, config)) {
				return;
			} else {
				const inputFacility = {
					name,
					description,
					location,
					capacity,
					status: 'active',
					createdAt: new Date(),
				};
				const inputResult = await mongo.insertOne(mongoClient, MODULE, inputFacility);
				if (inputResult) {
					console.log(`${apiName} MongoDB Success.`);
					res.status(200).json({
						message: 'Facility created successfully',
						_id: inputResult.insertedId,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Facility created successfully',
						data: inputResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.error('❌ Error creating Facility.');
					res.status(500).send({
						status: 500,
						message: 'Error creating Facility.',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Error creating Facility.',
						data: inputResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				}
			}
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

	// Update Facility by facilityId API
	app.patch(`/${ROUTE_PREPEND}/${VERSION}/facility/:facilityId`, async (req, res) => {
		// #swagger.tags = ['facilities']
		// #swagger.summary = 'Update a facility'
		// #swagger.description = 'Update an existing facility details by its ID'
		const traceId = uuidv4();
		const apiName = 'Update Facility API';
		const { facilityId } = req.params;
		const {
			name,
			description,
			location,
			capacity,
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
				'facilityId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const updateObj = {};
				if (name) updateObj.name = name;
				if (description) updateObj.description = description;
				if (location) updateObj.location = location;
				if (capacity) updateObj.capacity = capacity;
				if (status) updateObj.status = status;
				updateObj.updatedAt = new Date();

				const updateResult = await mongo.findOneAndUpdate(mongoClient, MODULE, { _id: mongo.getObjectId(facilityId) }, updateObj);
				if (!updateResult) {
					res.status(500).send({
						status: 500,
						message: 'Facility not updated'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Facility not updated',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				} else {
					res.status(200).send({
						status: 200,
						message: 'Facility updated successfully.',
						data: JSON.parse(JSON.stringify(updateResult)),
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Facility updated successfully.',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				}
			}
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

	// Delete Facility by facilityId API
	app.delete(`/${ROUTE_PREPEND}/${VERSION}/facility/:facilityId`, async (req, res) => {
		// #swagger.tags = ['facilities']
		// #swagger.summary = 'Delete a facility'
		// #swagger.description = 'Delete an existing facility by its ID'
		const traceId = uuidv4();
		const apiName = 'Delete Facility API';
		const { facilityId } = req.params;

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
				'facilityId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const deleteResult = await mongo.deleteOne(mongoClient, MODULE, { _id: mongo.getObjectId(facilityId) });
				if (deleteResult) {
					res.status(200).send({
						status: 200,
						message: 'Facility deleted successfully.',
						data: {
							facility: deleteResult
						},
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Facility deleted successfully.',
						data: deleteResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					res.status(500).send({
						status: 500,
						message: 'Facility not deleted'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Facility not deleted',
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				}
			}
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
