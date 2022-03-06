const { isValidObjectId } = require("mongoose");

const { repliesModel, commentsModel, comparisonsModel } = require("../models");
const notificationsController = require("../controllers/notifications");

exports.addComment = async (req, res, next) => {
	try {
		let { comparison, text } = req.body;
		const commentObj = {};
		commentObj.user = req.user._id;
		if (text) commentObj.text = text;
		if (comparison)
			if (isValidObjectId(comparison))
				if (await comparisonsModel.exists({ _id: comparison })) {
				} else return next(new Error("Comparison not found!"));
			else return next(new Error("Please enter valid comparison id!"));
		else return next(new Error("Please enter comparison id!"));
		commentObj.comparison = comparison;

		const comment = await commentsModel.create(commentObj);
		await comparisonsModel.updateOne(
			{ _id: comparison },
			{ $inc: { commentsCount: 1 } }
		);
		await notificationsController.newCommentNotification(comment._id);

		res.json({ success: true, comment });
	} catch (error) {
		next(error);
	}
};

exports.getComments = async (req, res, next) => {
	try {
		let { limit, page, comparison } = req.query;
		limit = Number(limit);
		page = Number(page);
		if (!limit) limit = 10;
		if (!page) page = 0;
		if (page) page = page - 1;
		const query = {};

		if (comparison)
			if (isValidObjectId(comparison))
				if (await comparisonsModel.exists({ _id: comparison })) {
				} else return next(new Error("Comparison not found!"));
			else return next(new Error("Please enter valid comparison id!"));
		else return next(new Error("Please enter comparison id!"));

		query.comparison = comparison;

		const comments = await commentsModel
			.find(query)
			.populate([
				{
					path: "user",
					select: "_id",
					populate: {
						path: "profile",
						model: "profiles",
						select: "picture firstname lastname client",
					},
				},
				{
					path: "comparison",
					select: "_id",
					populate: [
						{
							path: "visit1",
							model: "visits",
							select: "title",
						},
						{
							path: "visit2",
							model: "visits",
							select: "title",
						},
					],
				},
			])
			.sort({ createdAt: -1 })
			.skip(page * limit)
			.limit(limit);
		const totalCount = await commentsModel.find(query).count();
		res.json({
			success: true,
			totalPages: Math.ceil(totalCount / limit),
			comments,
		});
	} catch (error) {
		next(error);
	}
};

exports.addReply = async (req, res, next) => {
	try {
		let { comment, text } = req.body;
		const replyObj = {};
		replyObj.user = req.user._id;
		if (text) replyObj.text = text;
		if (comment)
			if (isValidObjectId(comment))
				if (await commentsModel.exists({ _id: comment })) {
				} else return next(new Error("Comment not found!"));
			else return next(new Error("Please enter valid comment id!"));
		else return next(new Error("Please enter comment id!"));
		replyObj.comment = comment;

		const reply = await repliesModel.create(replyObj);
		await commentsModel.updateOne(
			{ _id: comment },
			{ $inc: { repliesCount: 1 } }
		);

		res.json({ success: true, reply });
	} catch (error) {
		next(error);
	}
};

exports.getReplies = async (req, res, next) => {
	try {
		let { limit, page, comment } = req.query;
		limit = Number(limit);
		page = Number(page);
		if (!limit) limit = 10;
		if (!page) page = 0;
		if (page) page = page - 1;
		const query = {};

		if (comment)
			if (isValidObjectId(comment))
				if (await commentsModel.exists({ _id: comment })) {
				} else return next(new Error("Comment not found!"));
			else return next(new Error("Please enter valid comment id!"));
		else return next(new Error("Please enter comment id!"));

		query.comment = comment;

		const replies = await repliesModel
			.find(query)
			.populate({
				path: "user",
				select: "_id",
				populate: {
					path: "profile",
					model: "profiles",
					select: "picture firstname lastname client",
				},
			})
			.sort({ createdAt: -1 })
			.skip(page * limit)
			.limit(limit);
		const totalCount = await repliesModel.find(query).count();
		res.json({
			success: true,
			totalPages: Math.ceil(totalCount / limit),
			replies,
		});
	} catch (error) {
		next(error);
	}
};
