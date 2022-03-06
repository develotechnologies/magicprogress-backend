exports.verifyClient = (req, res, next) => {
	if (req.user.type === "client") {
		next();
	} else {
		const error = new Error("You are not authorized as client!");
		error.status = 403;
		return next(error);
	}
};

exports.verifyTherapist = (req, res, next) => {
	if (req.user.type === "therapist") {
		next();
	} else {
		const error = new Error("You are not authorized as therapist!");
		error.status = 403;
		return next(error);
	}
};
