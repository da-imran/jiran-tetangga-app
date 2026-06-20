const { v4: uuidv4 } = require('uuid');
const mongo = require('../utilities/mongodb');
const { requiredCheck } = require('../utilities/validation');
const { logger, LOG_LEVELS } = require('../utilities/logger');
const { MODULES, METHODS } = require('../utilities/constants');
const { secrets } = require('../utilities/secrets');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const SERVICE_NAME = process.env.SERVICE_NAME;
const MODULE = MODULES.USER_PASSWORDS;

/**
 * Send password reset email (placeholder - implement with email service)
 * @param {string} email - User email
 * @param {string} resetLink - Password reset link
 */
const sendResetEmail = async (email, resetLink) => {
	// TODO: Implement actual email sending (e.g., SendGrid, AWS SES, Nodemailer)
	// For now, just log the reset link
	logger.log({
		service: SERVICE_NAME,
		module: MODULE,
		apiName: 'Send Reset Email',
		level: LOG_LEVELS.INFO,
		message: 'Password reset link generated',
		email,
		resetLink
	});

	// In development/local, return the link so it can be displayed
	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
		return { devLink: resetLink };
	}

	return { sent: true };
};

module.exports = (app, config) => {
	const { mongoClient } = config;
	const ROUTE_PREPEND = process.env.ROUTE_PREPEND;
	const VERSION = process.env.VERSION;
	const ENCRYPTION_KEY = secrets.ENCRYPTION_KEY && secrets.ENCRYPTION_KEY.value;

	// Forgot Password API - Generate reset token
	app.post(`/${ROUTE_PREPEND}/${VERSION}/forgot-password`, async (req, res) => {
		// #swagger.tags = ['userPasswords']
		// #swagger.summary = 'Request a password reset link'
		// #swagger.description = "Generates a password reset token and sends a reset link to the user's email. In development/local mode, returns the devLink in the response for testing purposes."
		const traceId = uuidv4();
		const apiName = 'Forgot Password API';

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
			const { email } = req.body;

			const requiredFields = [
				'email',
			];
			const configObj = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, configObj)) {
				return;
			}

			// Find user by email using mongoFx helper for testability
			const user = await mongo.findOne(mongoClient, MODULES.ADMINISTRATOR, { email });

			if (!user) {
				// Don't reveal that user doesn't exist for security - just log and return success message
				logger.log({
					service: SERVICE_NAME,
					module: MODULE,
					apiName,
					status: 200,
					message: 'Password reset requested for non-existent email',
					traceId,
					level: LOG_LEVELS.INFO,
				});

				res.status(200).json({
					status: 200,
					message: 'If the email exists, a reset link has been sent.',
				});
				return;
			}

			// Generate JWT token for password reset (expires in 1 hour)
			const JWT_KEY = secrets.JWT_KEY && secrets.JWT_KEY.value;
			if (!JWT_KEY) {
				throw new Error('JWT_KEY is not initialized');
			}

			const resetToken = jwt.sign(
				{ userId: user._id, purpose: 'password_reset' },
				JWT_KEY,
				{ algorithm: 'HS256', expiresIn: '1h' }
			);

			// Store token hash in database (for additional security/invalidation)
			const tokenExpiry = new Date();
			tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour from now

			await mongo.findOneAndUpdate(
				mongoClient,
				MODULES.ADMINISTRATOR,
				{ _id: user._id },
				{
					passwordResetToken: resetToken,
					passwordResetExpires: tokenExpiry,
					passwordResetRequestedAt: new Date()
				}
			);

			const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

			// Send email (or return link in dev)
			const emailResult = await sendResetEmail(user.email, resetLink);

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Password reset link generated successfully',
				traceId,
				userId: user._id,
				devMode: !!emailResult.devLink,
				level: LOG_LEVELS.INFO,
			});

			res.status(200).json({
				status: 200,
				message: 'If the email exists, a reset link has been sent.',
				...(emailResult.devLink && { devLink: emailResult.devLink }) // Only in development
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

	// Reset Password API - Validate token and set new password
	app.post(`/${ROUTE_PREPEND}/${VERSION}/reset-password`, async (req, res) => {
		// #swagger.tags = ['userPasswords']
		// #swagger.summary = 'Reset password using a valid reset token'
		// #swagger.description = "Validates the reset token, verifies the new password meets security requirements, ensures it is different from the current password, and updates the user's password."
		const traceId = uuidv4();
		const apiName = 'Reset Password API';

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
			const { token, newPassword } = req.body;

			const requiredFields = [
				'token',
				'newPassword',
			];
			const configObj = {
				traceId,
				MODULE,
				apiName,
			};
			if (!requiredCheck(req.body, requiredFields, res, configObj)) {
				return;
			}

			// Verify JWT token
			const JWT_KEY = secrets.JWT_KEY && secrets.JWT_KEY.value;
			if (!JWT_KEY) {
				throw new Error('JWT_KEY is not initialized');
			}

			let decoded;
			try {
				decoded = jwt.verify(token, JWT_KEY, { algorithms: ['HS256'] });
			} catch (jwtErr) {
				res.status(400).send({
					status: 400,
					message: 'Invalid or expired reset token',
				});
				return;
			}

			// Verify token purpose
			if (decoded.purpose !== 'password_reset') {
				res.status(400).send({
					status: 400,
					message: 'Invalid token purpose',
				});
				return;
			}

			const userId = decoded.userId;
			const userObjectId = mongo.getObjectId(userId);

			// Validate new password
			if (!newPassword || newPassword.length < 8) {
				res.status(400).send({
					status: 400,
					message: 'Password must be at least 8 characters long',
				});
				return;
			}

			// At least 1 capital letter
			if (!/[A-Z]/.test(newPassword)) {
				res.status(400).send({
					status: 400,
					message: 'Password must contain at least 1 capital letter (A-Z)',
				});
				return;
			}

			// At least 1 number
			if (!/[0-9]/.test(newPassword)) {
				res.status(400).send({
					status: 400,
					message: 'Password must contain at least 1 number (0-9)',
				});
				return;
			}

			// At least 1 symbol
			if (!/[!@#$%^&*()_+\-=\]{};':"\\|,.<>?`~]/.test(newPassword)) {
				res.status(400).send({
					status: 400,
					message: 'Password must contain at least 1 symbol (e.g. ! @ # $ % ^ & *)',
				});
				return;
			}

			// Hash new password
			if (!ENCRYPTION_KEY) {
				throw new Error('ENCRYPTION_KEY is not initialized');
			}

			const hashedPassword = CryptoJS.AES.encrypt(newPassword, ENCRYPTION_KEY, { mode: CryptoJS.mode.ECB }).toString();

			// Find the user to compare current password
			const existingUser = await mongo.findOne(mongoClient, MODULES.ADMINISTRATOR, { _id: userObjectId || userId });

			// Check if new password is the same as current password
			if (existingUser && existingUser.password) {
				try {
					// Decrypt the existing password to compare with new plaintext password
					const decryptedPassword = CryptoJS.AES.decrypt(existingUser.password, ENCRYPTION_KEY, {
						mode: CryptoJS.mode.ECB
					}).toString(CryptoJS.enc.Utf8);

					if (decryptedPassword === newPassword) {
						res.status(400).send({
							status: 400,
							message: 'New password cannot be the same as your current password.',
						});
						return;
					}
				} catch (decryptError) {
					// If decryption fails, we'll allow the password change to avoid locking users out
				}
			}

			// Update user password using mongoFx helper for testability
			const updateResult = await mongo.findOneAndUpdate(
				mongoClient,
				MODULES.ADMINISTRATOR,
				{ _id: userObjectId || userId },
				{
					password: hashedPassword,
					passwordResetAt: new Date(),
				}
			);

			if (!updateResult) {
				res.status(404).send({
					status: 404,
					message: 'User not found',
				});
				return;
			}

			logger.log({
				service: SERVICE_NAME,
				module: MODULE,
				apiName,
				status: 200,
				message: 'Password reset successful',
				traceId,
				level: LOG_LEVELS.INFO,
			});

			res.status(200).send({
				status: 200,
				message: 'Password has been reset successfully.',
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