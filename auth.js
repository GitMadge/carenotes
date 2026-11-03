const jwt = require("jsonwebtoken");

require('dotenv').config();

//[SECTION] JSON Web Tokens
// The role ("patient" or "doctor") is stored in the token so routes can check it without another database call
module.exports.createAccessToken = (user) => {

	const data = {
		id: user._id,
		email: user.email,
		role: user.role
	}

	return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: "8h" });
}

//[SECTION] Token Verification
module.exports.verify = (req, res, next) => {

	let token = req.headers.authorization;

	if(typeof token === "undefined") {
		return res.status(401).send({ auth: "Failed. No Token" });
	} else {
		token = token.slice(7, token.length);

		jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decodedToken) {

			if(err) {
				return res.status(403).send({
					auth: "Failed",
					message: err.message
				})
			} else {
				req.user = decodedToken;
				next();
			}
		})
	}
}

//[SECTION] Role Checks
module.exports.verifyDoctor = (req, res, next) => {

	if(req.user.role === "doctor") {
		next();
	} else {
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden: doctors only"
		});
	}
}

module.exports.verifyPatient = (req, res, next) => {

	if(req.user.role === "patient") {
		next();
	} else {
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden: patients only"
		});
	}
}

//[SECTION] Error Handler
module.exports.errorHandler = (err, req, res, next) => {

	console.error(err);

	const errorMessage = err.message || 'Internal Server Error';

	res.status(err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500).json({
		error: {
			message: errorMessage,
			errorCode: err.code || 'SERVER_ERROR',
			details: err.details || null
		}
	});
};
