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
	const MODULE = MODULES.LOST_FOUND;

	// Get All LostFound Items API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/lostFound`, async (req, res) => {
		// #swagger.tags = ['lostFound']
		// #swagger.summary = 'Get all lost/found items'
		// #swagger.description = 'Retrieve all lost/found items with pagination and search support'
		const traceId = uuidv4();
		const apiName = 'Get All LostFound Items API';

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
						{ title: { $regex: safeSearch, $options: 'i' } },
						{ description: { $regex: safeSearch, $options: 'i' } },
						{ location: { $regex: safeSearch, $options: 'i' } },
						{ contact: { $regex: safeSearch, $options: 'i' } },
					];
				}

				if (typeof filters === 'string' && filters.trim() !== '') {
					const filterArray = filters.split(',').map(f => f.trim());
					matchStage.status = { $in: filterArray };
				}

				const aggregation = [
					{ $match: matchStage }, // Match
					{ $sort: { createdAt: -1 } }, // Sort
					{ $skip: (+pageNumber - 1) * (+dataPerPage) }, // Pagination
					{ $limit: +dataPerPage },
					// Projection
					{
						$project: {
							_id: 1,
							status: 1,
							category: 1,
							title: 1,
							description: 1,
							location: 1,
							date: 1,
							contact: 1,
							image: 1,
							resolved: 1,
							verified: 1,
							createdAt: 1,
						},
					}
				];

				const countPipeline = [{ $match: matchStage }, { $count: 'total' }];
				const [countResult, lostFoundResult] = await Promise.all([
					mongo.aggregate(mongoClient, MODULE, countPipeline),
					mongo.aggregate(mongoClient, MODULE, aggregation)
				]);

				if (lostFoundResult) {
					const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;

					console.log(`${apiName} Response Success.`);
					res.status(200).send({
						status: 200,
						data: lostFoundResult,
						total: totalCount
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Response Success.',
						data: lostFoundResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.log(`❌ ${apiName} Response Failed.`);
					res.status(404).send({
						status: 404,
						message: 'Lost/found items not found',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 404,
						message: 'Lost/found items not found',
						data: lostFoundResult,
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

	// Get LostFound item by id API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/lostFound/:lostFoundId`, async (req, res) => {
		// #swagger.tags = ['lostFound']
		// #swagger.summary = 'Get lost/found item by ID'
		// #swagger.description = 'Retrieve a specific lost/found item by its ID'
		const traceId = uuidv4();
		const apiName = 'Get LostFound Item API';
		const { lostFoundId } = req.params;

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
				'lostFoundId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const lostFoundResult = await mongo.findOne(mongoClient, MODULE, { _id: mongo.getObjectId(lostFoundId) });
				if (lostFoundResult) {
					console.log(`${apiName} Response Success.`);
					res.status(200).send({
						status: 200,
						data: lostFoundResult
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Response Success.',
						data: lostFoundResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.log(`❌ ${apiName} Response Failed.`);
					res.status(404).send({
						status: 404,
						message: 'Lost/found item not found',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 404,
						message: 'Lost/found item not found',
						data: lostFoundResult,
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

	// Create LostFound item API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/lostFound`, async (req, res) => {
		// #swagger.tags = ['lostFound']
		// #swagger.summary = 'Create a new lost/found item'
		// #swagger.description = 'Create a new lost/found item with all required details'
		const traceId = uuidv4();
		const apiName = 'Create LostFound Item API';
		const {
			status,
			category,
			title,
			description,
			location,
			contact,
			image,
			resolved,
			verified,
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
				'status',
				'category',
				'title',
				'description',
				'location',
				'contact',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, config)) {
				return;
			} else {
				// Validate status enum
				const validStatuses = ['lost', 'found'];
				if (!validStatuses.includes(status)) {
					res.status(400).send({
						status: 400,
						message: 'Bad request: invalid status value',
					});
					return;
				}

				// Validate category enum
				const validCategories = ['pet', 'phone', 'wallet', 'keys', 'bag', 'document', 'other'];
				if (!validCategories.includes(category)) {
					res.status(400).send({
						status: 400,
						message: 'Bad request: invalid category value',
					});
					return;
				}

				const inputLostFound = {
					status,
					category,
					title,
					description,
					location,
					contact,
					image: image || undefined,
					resolved: resolved || false,
					verified: verified || false,
					createdAt: new Date(),
				};
				const inputResult = await mongo.insertOne(mongoClient, MODULE, inputLostFound);
				if (inputResult) {
					console.log(`${apiName} MongoDB Success.`);
					res.status(200).json({
						message: 'Lost/found item created successfully',
						_id: inputResult.insertedId,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Lost/found item created successfully',
						data: inputResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.error('❌ Error creating LostFound.');
					res.status(500).send({
						status: 500,
						message: 'Error creating LostFound.',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Error creating LostFound.',
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

	// Update LostFound item by id API
	app.patch(`/${ROUTE_PREPEND}/${VERSION}/lostFound/:lostFoundId`, async (req, res) => {
		// #swagger.tags = ['lostFound']
		// #swagger.summary = 'Update a lost/found item'
		// #swagger.description = 'Update an existing lost/found item details by its ID'
		const traceId = uuidv4();
		const apiName = 'Update LostFound Item API';
		const { lostFoundId } = req.params;
		const {
			status,
			category,
			title,
			description,
			location,
			contact,
			image,
			resolved,
			verified,
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
				'lostFoundId',
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
				if (status !== undefined) updateObj.status = status;
				if (category !== undefined) updateObj.category = category;
				if (title !== undefined) updateObj.title = title;
				if (description !== undefined) updateObj.description = description;
				if (location !== undefined) updateObj.location = location;
				if (contact !== undefined) updateObj.contact = contact;
				if (image !== undefined) updateObj.image = image;
				if (resolved !== undefined) updateObj.resolved = resolved;
				if (verified !== undefined) updateObj.verified = verified;
				updateObj.updatedAt = new Date();

				const updateResult = await mongo.findOneAndUpdate(mongoClient, MODULE, { _id: mongo.getObjectId(lostFoundId) }, updateObj);
				if (!updateResult) {
					res.status(500).send({
						status: 500,
						message: 'Lost/found item not updated'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Lost/found item not updated',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				} else {
					res.status(200).send({
						status: 200,
						message: 'Lost/found item updated successfully.',
						data: JSON.parse(JSON.stringify(updateResult)),
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Lost/found item updated successfully.',
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

	// Delete LostFound item by id API
	app.delete(`/${ROUTE_PREPEND}/${VERSION}/lostFound/:lostFoundId`, async (req, res) => {
		// #swagger.tags = ['lostFound']
		// #swagger.summary = 'Delete a lost/found item'
		// #swagger.description = 'Delete an existing lost/found item by its ID'
		const traceId = uuidv4();
		const apiName = 'Delete LostFound Item API';
		const { lostFoundId } = req.params;

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
				'lostFoundId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const deleteResult = await mongo.deleteOne(mongoClient, MODULE, { _id: mongo.getObjectId(lostFoundId) });
				if (deleteResult) {
					res.status(200).send({
						status: 200,
						message: 'Lost/found item deleted successfully.',
						data: {
							lostFound: deleteResult
						},
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Lost/found item deleted successfully.',
						data: deleteResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					res.status(500).send({
						status: 500,
						message: 'Lost/found item not deleted'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Lost/found item not deleted',
						data: deleteResult,
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