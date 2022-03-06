const { isValidObjectId } = require("mongoose");
const {
	commentsModel,
	messagesModel,
	notificationsModel,
} = require("../models");
const firebaseManager = require("../utils/firebaseManager");

exports.getAllNotifications = (req, res, next) => {
	try {
		const { user, type } = req.user;
		let { q, page, limit } = req.query;
		const query = { user: req.user._id };

		page = Number(page);
		limit = Number(limit);
		if (!limit) limit = 10;
		if (!page) page = 1;
		Promise.all([
			notificationsModel.find(query).count(),
			notificationsModel
				.find(query)
				.populate([
					{
						path: "messenger",
						select: "_id",
						populate: {
							path: "profile",
							model: "profiles",
							select: "picture firstname lastname client therapist",
						},
					},
					{
						path: "commenter",
						select: "_id",
						populate: {
							path: "profile",
							model: "profiles",
							select: "picture firstname lastname client therapist",
						},
					},
				])
				.sort("-createdAt")
				.skip((page - 1) * limit)
				.limit(limit),
		]).then(([total, notifications]) => {
			const totalPages = Math.ceil(total / limit);
			res.json({ success: true, currentPage: page, totalPages, notifications });
		});
	} catch (error) {
		next(error);
	}
};

exports.newMessageNotification = async (message, callback) => {
	try {
		const messageExists = await messagesModel
			.findOne({ _id: message })
			.populate([
				{
					path: "userTo",
					populate: { path: "profile", model: "profiles" },
				},
				{
					path: "userFrom",
					populate: { path: "profile", model: "profiles" },
				},
			]);
		if (messageExists) {
			const title = "New Message";
			let body = `New message from {"user":"${messageExists.userFrom._id}"} !`;
			await notificationsModel.create({
				type: "new-message",
				text: body,
				message: messageExists._id,
				messenger: messageExists.userFrom,
				user: messageExists.userTo,
			});
			body = `New message from ${messageExists.userFrom.profile.firstname}!`;
			await messageExists.userTo.fcms.forEach(async (element) => {
				await firebaseManager.sendNotification(
					element.fcm,
					title,
					body,
					messageExists
				);
			});
			// callback();
			return;
			console.log(searchObjectsInArray(body, ["user"]));
		} else throw new Error("Message not found!");
	} catch (error) {
		throw error;
	}
};

exports.newCommentNotification = async (comment, callback) => {
	try {
		const commentExists = await commentsModel
			.findOne({ _id: comment })
			.populate([
				{
					path: "user",
					populate: { path: "profile", model: "profiles" },
				},
				{
					path: "comparison",
					populate: {
						path: "visit1",
						model: "visits",
						populate: {
							path: "consultancy",
							model: "consultancies",
							populate: [
								{ path: "client", model: "users" },
								{ path: "therapist", model: "users" },
							],
						},
					},
				},
			]);
		if (commentExists) {
			let user;
			if (commentExists.user.type === "therapist")
				user = commentExists.comparison.visit1.consultancy.client;
			else if (commentExists.user.type === "client")
				user = commentExists.comparison.visit1.consultancy.therapist;

			const title = `New Comment from ${commentExists.user.profile.firstname}`;
			let body = `{"user":"${commentExists.user._id}"} added a comment on the visits comparison`;
			await notificationsModel.create({
				type: "new-comment",
				text: body,
				comment: commentExists._id,
				commenter: commentExists.user,
				user: user._id,
			});
			body = `${commentExists.user.profile.firstname} ${commentExists.user.profile.lastname} added a comment on the visits comparison`;
			await user.fcms.forEach(async (element) => {
				await firebaseManager.sendNotification(
					element.fcm,
					title,
					body,
					commentExists
				);
			});
			// callback();
			return;
		} else throw new Error("Comment not found!");
	} catch (error) {
		throw error;
	}
};

function searchObjectsInArray(string, keysArray) {
	const strArray = string.split(" ");
	let object = {};
	keysArray.forEach((element) => {
		const obj = JSON.parse(
			strArray.find(function (str) {
				return str.includes(element);
			})
		);
		object = { ...object, ...obj };
	});
	return object;
}
