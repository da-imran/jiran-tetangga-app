/* eslint-disable indent */
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
	const MODULE = MODULES.CONTACTS;

	// Get All Contacts API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/contacts`, async (req, res) => {
		// #swagger.tags = ['contacts']
		// #swagger.summary = 'Get all contacts'
		// #swagger.description = 'Retrieve all contacts with pagination and search support'
		const traceId = uuidv4();
		const apiName = 'Get All Contacts API';

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
					matchStage.name = { $regex: safeSearch, $options: 'i' };
				}

				if (typeof filters === 'string' && filters.trim() !== '') {
					const filterArray = filters.split(',').map(f => f.trim());
  					matchStage.status = { $in: filterArray };
				}
				const aggregation = [
					{ $match: matchStage }, // Match
					{ $sort: { createdAt : -1 } }, // Sort
					{ $skip: (+pageNumber - 1) * (+dataPerPage) }, // Pagination
					{ $limit: +dataPerPage },
					// Projection
					{
						$project: {
							name: 1,
							description: 1,
							status: 1,
							openingHours: 1,
							createdAt: 1,
						},
					}
				];

				const countPipeline = [{ $match: matchStage }, { $count: 'total' }];
				const [countResult, contactResult] = await Promise.all([
				  mongo.aggregate(mongoClient, MODULE, countPipeline),
				  mongo.aggregate(mongoClient, MODULE, aggregation)
				]);

				// Always return 200 for list endpoints, even if empty


				const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;



				console.log(`${apiName} Response Success.`);


				res.status(200).send({


					status: 200,


					data: contactResult || [],


					total: totalCount


				});



				logger.log({


					service: SERVICE_NAME,


					module: MODULE,


					apiName,


					status: 200,


					message: 'Response Success',


					data: contactResult || [],


					traceId,


					level: LOG_LEVELS.INFO,


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

	// Get Contact by contactId API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/contact/:contactId`, async (req, res) => {
		// #swagger.tags = ['contacts']
		// #swagger.summary = 'Get contact by ID'
		// #swagger.description = 'Retrieve a specific contact by its ID'
		const traceId = uuidv4();
		const apiName = 'Get Contact API';
		const { contactId } = req.params;

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
				'contactId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const contactResult = await mongo.findOne(mongoClient, MODULE, { _id: mongo.getObjectId(contactId) });
				// Always return 200 for list endpoints, even if empty

				const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;


				console.log(`${apiName} Response Success.`);

				res.status(200).send({

					status: 200,

					data: contactResult || [],

					total: totalCount

				});


				logger.log({

					service: SERVICE_NAME,

					module: MODULE,

					apiName,

					status: 200,

					message: 'Response Success',

					data: contactResult || [],

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

	// Create Contact API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/contact`, async (req, res) => {
		// #swagger.tags = ['contacts']
		// #swagger.summary = 'Create a new contact'
		// #swagger.description = 'Create a new contact with service name, number and status'
		const traceId = uuidv4();
		const apiName = 'Create Contact API';
		const {
			name,
			number,
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
				'number',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, config)) {
				return;
			} else {
				// 🔎 Proceed to create contact
				const inputContact = {
					name,
					number,
					status: 'inactive', // Default status
					createdAt: new Date(),
				};
				const inputResult = await mongo.insertOne(mongoClient, MODULE, inputContact);
				if (inputResult) {
					console.log(`${apiName} MongoDB Success.`);
					res.status(200).json({
						message: 'Contact created successfully',
						_id: inputResult.insertedId,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Contact created successfully',
						data: inputResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.error('❌ Error creating Contact.');
					res.status(500).send({
						status: 500,
						message: 'Error creating Contact.',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Error creating Contact.',
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

	// Update Contact by contactId API
	app.patch(`/${ROUTE_PREPEND}/${VERSION}/contact/:contactId`, async (req, res) => {
		// #swagger.tags = ['contacts']
		// #swagger.summary = 'Update a contact'
		// #swagger.description = 'Update an existing contact details by its ID'
		const traceId = uuidv4();
		const apiName = 'Update Contact API';
		const { contactId } = req.params;
		const {
			name,
            number,
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
				'contactId',
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
				if (number) updateObj.number = number;
				if (status) updateObj.status = status;
				updateObj.updatedAt = new Date();

				const updateResult = await mongo.findOneAndUpdate(mongoClient, MODULE, { _id: mongo.getObjectId(contactId) }, updateObj);
				if (!updateResult) {
					res.status(500).send({
						status: 500,
						message: 'Contact not updated'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Contact not updated',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				} else {
					res.status(200).send({
						status: 200,
						message: 'Contact updated successfully.',
						data: JSON.parse(JSON.stringify(updateResult)),
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Contact updated successfully.',
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

	// Delete Contact by contactId API
	app.delete(`/${ROUTE_PREPEND}/${VERSION}/contact/:contactId`, async (req, res) => {
		// #swagger.tags = ['contacts']
		// #swagger.summary = 'Delete a contact'
		// #swagger.description = 'Delete an existing contact by its ID'
		const traceId = uuidv4();
		const apiName = 'Delete Contact API';
		const { contactId } = req.params;

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
				'contactId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const deleteResult = await mongo.deleteOne(mongoClient, MODULE, { _id: mongo.getObjectId(contactId) });
				if (deleteResult) {
					res.status(200).send({
						status: 200,
						message: 'Contact deleted successfully.',
						data: {
							contact: deleteResult
						},
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Contact deleted successfully.',
						data: deleteResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					res.status(500).send({
						status: 500,
						message: 'Contact not deleted'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Contact not deleted',
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
