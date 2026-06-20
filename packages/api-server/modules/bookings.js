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
	const MODULE = MODULES.BOOKINGS;

	// Get All Bookings API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/bookings`, async (req, res) => {
		// #swagger.tags = ['bookings']
		// #swagger.summary = 'Get all bookings'
		// #swagger.description = 'Retrieve all bookings with pagination and search support'
		const traceId = uuidv4();
		const apiName = 'Get All Bookings API';

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
						{ description: { $regex: safeSearch, $options: 'i' } },
						{ userName: { $regex: safeSearch, $options: 'i' } },
						{ facilityName: { $regex: safeSearch, $options: 'i' } },
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
							description: 1,
							userName: 1,
							facilityName: 1,
							bookingDate: 1,
							status: 1,
							createdAt: 1,
						},
					}
				];

				const countPipeline = [{ $match: matchStage }, { $count: 'total' }];
				const [countResult, bookingResult] = await Promise.all([
					mongo.aggregate(mongoClient, MODULE, countPipeline),
					mongo.aggregate(mongoClient, MODULE, aggregation)
				]);

				// Always return 200 for list endpoints, even if empty


				const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;



				console.log(`${apiName} Response Success.`);


				res.status(200).send({


					status: 200,


					data: bookingResult || [],


					total: totalCount


				});



				logger.log({


					service: SERVICE_NAME,


					module: MODULE,


					apiName,


					status: 200,


					message: 'Response Success',


					data: bookingResult || [],


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

	// Get Booking by bookingId API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/booking/:bookingId`, async (req, res) => {
		// #swagger.tags = ['bookings']
		// #swagger.summary = 'Get booking by ID'
		// #swagger.description = 'Retrieve a specific booking by its ID'
		const traceId = uuidv4();
		const apiName = 'Get Booking API';
		const { bookingId } = req.params;

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
				'bookingId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const bookingResult = await mongo.findOne(mongoClient, MODULE, { _id: mongo.getObjectId(bookingId) });
				if (bookingResult) {
					console.log(`${apiName} Response Success.`);
					res.status(200).send({
						status: 200,
						data: bookingResult,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Response Success',
						data: bookingResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.log(`❌ ${apiName} Response Failed.`);
					res.status(404).send({
						status: 404,
						message: 'Booking not found',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 404,
						message: 'Booking not found',
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

	// Create Booking API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/booking`, async (req, res) => {
		// #swagger.tags = ['bookings']
		// #swagger.summary = 'Create a new booking'
		// #swagger.description = 'Create a new booking with all required details'
		const traceId = uuidv4();
		const apiName = 'Create Booking API';
		const {
			description,
			userName,
			facilityName,
			bookingDate,
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
				'description',
				'userName',
				'facilityName',
				'bookingDate',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, config)) {
				return;
			} else {
				const inputBooking = {
					description,
					userName,
					facilityName,
					bookingDate,
					status: 'pending',
					createdAt: new Date(),
				};
				const inputResult = await mongo.insertOne(mongoClient, MODULE, inputBooking);
				if (inputResult) {
					console.log(`${apiName} MongoDB Success.`);
					res.status(200).json({
						message: 'Booking created successfully',
						_id: inputResult.insertedId,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Booking created successfully',
						data: inputResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.error('❌ Error creating Booking.');
					res.status(500).send({
						status: 500,
						message: 'Error creating Booking.',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Error creating Booking.',
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

	// Update Booking by bookingId API
	app.patch(`/${ROUTE_PREPEND}/${VERSION}/booking/:bookingId`, async (req, res) => {
		// #swagger.tags = ['bookings']
		// #swagger.summary = 'Update a booking'
		// #swagger.description = 'Update an existing booking details by its ID'
		const traceId = uuidv4();
		const apiName = 'Update Booking API';
		const { bookingId } = req.params;
		const {
			description,
			userName,
			facilityName,
			bookingDate,
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
				'bookingId',
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
				if (description) updateObj.description = description;
				if (userName) updateObj.userName = userName;
				if (facilityName) updateObj.facilityName = facilityName;
				if (bookingDate) updateObj.bookingDate = bookingDate;
				if (status) updateObj.status = status;
				updateObj.updatedAt = new Date();

				const updateResult = await mongo.findOneAndUpdate(mongoClient, MODULE, { _id: mongo.getObjectId(bookingId) }, updateObj);
				if (!updateResult) {
					res.status(500).send({
						status: 500,
						message: 'Booking not updated'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Booking not updated',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				} else {
					res.status(200).send({
						status: 200,
						message: 'Booking updated successfully.',
						data: JSON.parse(JSON.stringify(updateResult)),
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Booking updated successfully.',
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

	// Delete Booking by bookingId API
	app.delete(`/${ROUTE_PREPEND}/${VERSION}/booking/:bookingId`, async (req, res) => {
		// #swagger.tags = ['bookings']
		// #swagger.summary = 'Delete a booking'
		// #swagger.description = 'Delete an existing booking by its ID'
		const traceId = uuidv4();
		const apiName = 'Delete Booking API';
		const { bookingId } = req.params;

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
				'bookingId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const deleteResult = await mongo.deleteOne(mongoClient, MODULE, { _id: mongo.getObjectId(bookingId) });
				if (deleteResult) {
					res.status(200).send({
						status: 200,
						message: 'Booking deleted successfully.',
						data: {
							booking: deleteResult
						},
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Booking deleted successfully.',
						data: deleteResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					res.status(500).send({
						status: 500,
						message: 'Booking not deleted'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Booking not deleted',
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
