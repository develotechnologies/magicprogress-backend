const { ErrorResponder } = require("../../utils/errorResponder");

const error = (err, req, res, next) => {
	let error = { ...err };
	error.message = err.message;

	console.error(err);

	if (err.name === "CastError") {
		const message = `Resource not found with id ${err.value}`;
		error = new ErrorResponder(message, 404);
	}

	if (err.name === "ValidationError") {
		const message = Object.values(err.errors).map((e) => e.message);
		error = new ErrorResponder(message, 400);
	}

	//duplicate value found
	if (err.code === 11000) {
		let field = Object.keys(err.keyPattern)[0];
		field = field.charAt(0).toUpperCase() + field.slice(1);
		const message = `${field} already used, try another one instead!`;
		error = new ErrorResponder(message, 400);
	}

	res.status(error.statusCode || 500).json({
		success: false,
		error: error.message || "Server Error",
	});
};
module.exports = error;
