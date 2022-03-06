const { isValidObjectId } = require("mongoose");

const { consultanciesModel, usersModel } = require("../models");

exports.addConsultancy = async (req, res, next) => {
	try {
		let { client, therapist } = req.body;
		const consultancyObj = {};
		const query = { $and: [{ client }, { therapist }] };

		if (req.user.type === "client") consultancyObj.client = req.user._id;
		else if (client)
			if (isValidObjectId(client))
				if (await usersModel.exists({ _id: client })) {
				} else return next(new Error("Client not found!"));
			else return next(new Error("Please enter valid client id!"));
		else return next(new Error("Please enter client id!"));

		if (req.user.type === "therapist") consultancyObj.therapist = req.user._id;
		else if (therapist)
			if (isValidObjectId(therapist))
				if (await usersModel.exists({ _id: therapist })) {
				} else return next(new Error("Therapist not found!"));
			else return next(new Error("Please enter valid therapist id!"));
		else return next(new Error("Please enter therapist id!"));

		if (await consultanciesModel.exists(query))
			return next(new Error("Consultancy already exists!"));

		const consultancy = await consultanciesModel.create(consultancyObj);

		res.json({ success: true, consultancy });
	} catch (error) {
		next(error);
	}
};

exports.getConsultancies = async (req, res, next) => {
	try {
		let { limit, page } = req.query;
		limit = Number(limit);
		page = Number(page);
		if (!limit) limit = 10;
		if (!page) page = 0;
		if (page) page = page - 1;
		const query = {};

		if (req.user.type === "client") query.client = req.user._id;
		else if (req.user.type === "therapist") query.therapist = req.user._id;

		const consultancies = await consultanciesModel
			.find(query)
			.sort({ createdAt: -1 })
			.skip(page * limit)
			.limit(limit);
		const totalCount = await consultanciesModel.find(query).count();
		res.json({
			success: true,
			totalPages: Math.ceil(totalCount / limit),
			consultancies,
		});
	} catch (error) {
		next(error);
	}
};
