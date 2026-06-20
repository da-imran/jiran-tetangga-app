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
	const MODULE = MODULES.MARKETPLACE;

	// Get All Listings API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/listings`, async (req, res) => {
		// #swagger.tags = ['listings']
		// #swagger.summary = 'Get all marketplace listings'
		// #swagger.description = 'Retrieve all marketplace listings with optional filtering and search support'
		const traceId = uuidv4();
		const apiName = 'Get All Listings API';

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
				category,
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
						{ tags: { $elemMatch: { $regex: safeSearch, $options: 'i' } } },
					];
				}

				if (typeof category === 'string' && category.trim() !== '') {
					const categoryArray = category.split(',').map(c => c.trim());
					matchStage.category = { $in: categoryArray };
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
							category: 1,
							price: 1,
							seller: 1,
							location: 1,
							contact: 1,
							tags: 1,
							status: 1,
							createdAt: 1,
							updatedAt: 1,
						},
					}
				];

				const countPipeline = [{ $match: matchStage }, { $count: 'total' }];
				const [countResult, listingResult] = await Promise.all([
					mongo.aggregate(mongoClient, MODULE, countPipeline),
					mongo.aggregate(mongoClient, MODULE, aggregation)
				]);

				// Always return 200 for list endpoints, even if empty


				const totalCount = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;



				console.log(`${apiName} Response Success.`);


				res.status(200).send({


					status: 200,


					data: listingResult || [],


					total: totalCount


				});



				logger.log({


					service: SERVICE_NAME,


					module: MODULE,


					apiName,


					status: 200,


					message: 'Response Success',


					data: listingResult || [],


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

	// Get Listing by listingId API
	app.get(`/${ROUTE_PREPEND}/${VERSION}/listing/:listingId`, async (req, res) => {
		// #swagger.tags = ['listings']
		// #swagger.summary = 'Get listing by ID'
		// #swagger.description = 'Retrieve a specific marketplace listing by its ID'
		const traceId = uuidv4();
		const apiName = 'Get Listing API';
		const { listingId } = req.params;

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
				'listingId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const listingResult = await mongo.findOne(mongoClient, MODULE, { _id: mongo.getObjectId(listingId) });
				if (listingResult) {
					console.log(`${apiName} Response Success.`);
					res.status(200).send({
						status: 200,
						data: listingResult,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Response Success',
						data: listingResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.log(`❌ ${apiName} Response Failed.`);
					res.status(404).send({
						status: 404,
						message: 'Listing not found',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 404,
						message: 'Listing not found',
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

	// Create Listing API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/listing`, async (req, res) => {
		// #swagger.tags = ['listings']
		// #swagger.summary = 'Create a new marketplace listing'
		// #swagger.description = 'Create a new marketplace listing with all required details'
		const traceId = uuidv4();
		const apiName = 'Create Listing API';
		const {
			title,
			description,
			category,
			price,
			seller,
			location,
			contact,
			tags,
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
				'category',
				'price',
				'seller',
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
				// Validate category enum
				const validCategories = ['tuition', 'food', 'handyman', 'pet', 'tools', 'jobs'];
				if (!validCategories.includes(category)) {
					res.status(400).send({
						status: 400,
						message: 'Bad request: invalid category value',
					});
					return;
				}

				// Validate price is non-negative
				if (typeof price !== 'number' || price < 0) {
					res.status(400).send({
						status: 400,
						message: 'Bad request: price must be a non-negative number',
					});
					return;
				}

				const inputListing = {
					title,
					description,
					category,
					price,
					seller,
					location,
					contact,
					tags: tags || [],
					status: 'pending',
					createdAt: new Date(),
				};
				const inputResult = await mongo.insertOne(mongoClient, MODULE, inputListing);
				if (inputResult) {
					console.log(`${apiName} MongoDB Success.`);
					res.status(200).json({
						message: 'Listing created successfully',
						_id: inputResult.insertedId,
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Listing created successfully',
						data: inputResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					console.error('❌ Error creating Listing.');
					res.status(500).send({
						status: 500,
						message: 'Error creating Listing.',
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Error creating Listing.',
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

	// Update Listing by listingId API
	app.patch(`/${ROUTE_PREPEND}/${VERSION}/listing/:listingId`, async (req, res) => {
		// #swagger.tags = ['listings']
		// #swagger.summary = 'Update a marketplace listing'
		// #swagger.description = 'Update an existing marketplace listing details by its ID'
		const traceId = uuidv4();
		const apiName = 'Update Listing API';
		const { listingId } = req.params;
		const {
			title,
			description,
			category,
			price,
			seller,
			location,
			contact,
			tags,
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
				'listingId',
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
				if (title) updateObj.title = title;
				if (description) updateObj.description = description;
				if (category) updateObj.category = category;
				if (price) updateObj.price = price;
				if (seller) updateObj.seller = seller;
				if (location) updateObj.location = location;
				if (contact) updateObj.contact = contact;
				if (tags) updateObj.tags = tags;
				if (status) updateObj.status = status;
				updateObj.updatedAt = new Date();

				const updateResult = await mongo.findOneAndUpdate(mongoClient, MODULE, { _id: mongo.getObjectId(listingId) }, updateObj);
				if (!updateResult) {
					res.status(500).send({
						status: 500,
						message: 'Listing not updated'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Listing not updated',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				} else {
					res.status(200).send({
						status: 200,
						message: 'Listing updated successfully.',
						data: JSON.parse(JSON.stringify(updateResult)),
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Listing updated successfully.',
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

	// Delete Listing by listingId API
	app.delete(`/${ROUTE_PREPEND}/${VERSION}/listing/:listingId`, async (req, res) => {
		// #swagger.tags = ['listings']
		// #swagger.summary = 'Delete a marketplace listing'
		// #swagger.description = 'Delete an existing marketplace listing by its ID'
		const traceId = uuidv4();
		const apiName = 'Delete Listing API';
		const { listingId } = req.params;

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
				'listingId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const deleteResult = await mongo.deleteOne(mongoClient, MODULE, { _id: mongo.getObjectId(listingId) });
				if (deleteResult) {
					res.status(200).send({
						status: 200,
						message: 'Listing deleted successfully.',
						data: {
							listing: deleteResult
						},
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Listing deleted successfully.',
						data: deleteResult,
						traceId,
						level: LOG_LEVELS.INFO,
					});
				} else {
					res.status(500).send({
						status: 500,
						message: 'Listing not deleted'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Listing not deleted',
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

	// Mark listing as sold API
	app.post(`/${ROUTE_PREPEND}/${VERSION}/listing/:listingId/sold`, async (req, res) => {
		// #swagger.tags = ['listings']
		// #swagger.summary = 'Mark a listing as sold'
		// #swagger.description = 'Marks a marketplace listing as sold'
		const traceId = uuidv4();
		const apiName = 'Mark Listing Sold API';
		const { listingId } = req.params;

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
				'listingId',
			];
			const config = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.params, requiredFields, res, config)) {
				return;
			} else {
				const updateResult = await mongo.findOneAndUpdate(
					mongoClient,
					MODULE,
					{ _id: mongo.getObjectId(listingId) },
					{ status: 'sold', updatedAt: new Date() }
				);
				if (!updateResult) {
					res.status(500).send({
						status: 500,
						message: 'Listing not updated'
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 500,
						message: 'Listing not updated',
						data: updateResult,
						traceId,
						level: LOG_LEVELS.ERROR,
					});
				} else {
					res.status(200).send({
						status: 200,
						message: 'Listing marked as sold successfully.',
						data: JSON.parse(JSON.stringify(updateResult)),
					});

					logger.log({
						service: SERVICE_NAME,
						module: MODULE,
						apiName,
						status: 200,
						message: 'Listing marked as sold successfully.',
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
};
