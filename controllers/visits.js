const { isValidObjectId } = require("mongoose");

const {
	usersModel,
	visitsModel,
	comparisonsModel,
	consultanciesModel,
} = require("../models");

exports.addVisit = async (req, res, next) => {
	try {
		let { client, consultancy } = req.body;
		const { images } = req.files || {};
		const visitObj = {};

		if (req.user.type === "client") client = req.user._id;
		else if (client)
			if (isValidObjectId(client))
				if (await usersModel.exists({ _id: client, type: "client" }))
					if (req.user.type === "therapist") {
					} else return next(new Error("Unauthorized as Therapist!"));
				else return next(new Error("Client not found!"));
			else return next(new Error("Please enter valid client id!"));
		else return next(new Error("Please enter client id!"));
		visitObj.client = client;

		if (consultancy)
			if (isValidObjectId(consultancy))
				if (await consultanciesModel.exists({ _id: consultancy }))
					visitObj.consultancy = consultancy;
				else return next(new Error("Consultancy not found!"));
			else return next(new Error("Please enter valid consultancy id!"));
		else {
			const consultancyExists = await consultanciesModel.findOne({ client });
			if (consultancyExists) consultancy = consultancyExists._id;
			else return next(new Error("Consultancy not found!"));
		}
		visitObj.consultancy = consultancy;

		if (images) {
			images.forEach((image) => {
				if (image.path) {
					if (image.originalname === "front.jpg")
						visitObj.frontImage = image.filename;
					else if (image.originalname === "right.jpg")
						visitObj.rightImage = image.filename;
					else if (image.originalname === "left.jpg")
						visitObj.leftImage = image.filename;
					else if (image.originalname === "back.jpg")
						visitObj.backImage = image.filename;
				}
			});
		} else return next(new Error("Please add images!"));
		const visitExists = await visitsModel
			.findOne({ client })
			.sort({ $natural: -1 });

		if (visitExists) visitObj.number = visitExists.number + 1;
		else visitObj.number = 1;
		visitObj.title = `Visit ${visitObj.number}`;

		const visit = await visitsModel.create(visitObj);

		await consultanciesModel.updateOne(
			{ _id: consultancy },
			{ $inc: { visitsCount: 1 } }
		);

		res.json({ success: true, visit });
	} catch (error) {
		next(error);
	}
};

exports.getVisit = async (req, res, next) => {
	try {
		let { visit } = req.params;
		if (visit)
			if (isValidObjectId(visit)) {
				const visitExists = await visitsModel.findOne({ _id: visit });
				if (visitExists)
					return res.json({
						success: "true",
						visit: visitExists,
					});
				else return next(new Error("Visit not found!"));
			} else return next(new Error("Please enter valid user id!"));
		else return next(new Error("Please enter visit id!"));
	} catch (error) {
		next(error);
	}
};

exports.getAllVisits = async (req, res, next) => {
	try {
		let { limit, page, client, q } = req.query;
		limit = Number(limit);
		page = Number(page);
		if (!limit) limit = 10;
		if (!page) page = 0;
		if (page) page = page - 1;
		const query = {};
		if (q) query.$or = [{ title: { $regex: q, $options: "i" } }];

		if (req.user.type === "client") client = req.user._id;
		else if (client)
			if (isValidObjectId(client))
				if (await usersModel.exists({ _id: client, type: "client" }))
					if (req.user.type === "therapist") {
					} else return next(new Error("Unauthorized as Therapist!"));
				else return next(new Error("Client not found!"));
			else return next(new Error("Please enter valid client id!"));
		else return next(new Error("Please enter client id!"));

		query.client = client;

		const visits = await visitsModel
			.find(query, { _id: 1, consultancy: 1 })
			.populate({
				path: "client",
				select: "_id",
				populate: {
					path: "profile",
					model: "profiles",
					select: "picture client",
					// populate: { path: "client", model: "clients", select: "_id" },
				},
			})
			.sort({ createdAt: -1 })
			.skip(page * limit)
			.limit(limit);
		const totalCount = await visitsModel.find(query).count();
		res.json({
			success: true,
			totalPages: Math.ceil(totalCount / limit),
			visits,
		});
	} catch (error) {
		next(error);
	}
};

exports.compareVisits = async (req, res, next) => {
	try {
		let { visit1, visit2 } = req.body;
		if (visit1 === visit2)
			return next(new Error("Same visit comparison denied!"));
		const comparisonObj = {};
		const query = {
			$or: [
				{ $and: [{ visit1 }, { visit2 }] },
				{ $and: [{ visit1: visit2 }, { visit2: visit1 }] },
			],
		};
		if (visit1)
			if (isValidObjectId(visit1))
				if (await visitsModel.exists({ _id: visit1 })) {
				} else return next(new Error("Visit1 not found!"));
			else return next(new Error("Please enter valid visit1 id!"));
		else return next(new Error("Please enter visit1 id!"));

		if (visit2)
			if (isValidObjectId(visit2))
				if (await visitsModel.exists({ _id: visit2 })) {
				} else return next(new Error("Visit2 not found!"));
			else return next(new Error("Please enter valid visit2 id!"));
		else return next(new Error("Please enter visit2 id!"));

		const comparisonExists = await comparisonsModel.findOne(query);

		if (comparisonExists) {
		} else {
			comparisonObj.visit1 = visit1;
			comparisonObj.visit2 = visit2;
			var comparison = await comparisonsModel.create(comparisonObj);
		}

		res.json({ success: true, comparison: comparisonExists ?? comparison });
	} catch (error) {
		next(error);
	}
};
