const dayjs = require("dayjs");
const { isValidObjectId, Types } = require("mongoose");

const { getToken } = require("../middlewares/public/authenticator");
const { throwError } = require("../utils/errorResponder");
const {
	clientsModel,
	consultanciesModel,
	passwordTokensModel,
	profilesModel,
	therapistsModel,
	usersModel,
} = require("../models");
const profilesController = require("./profiles");
const sendEmail = require("../utils/nodeMailer");

exports.signup = async (req, res, next) => {
	try {
		let { therapist } = req.body;
		const { username, email, password, phone, type } = req.body;
		const { firstname, lastname, gender, birthdate, description } = req.body;
		const { picture } = req.files || {};
		const userObj = {};
		if (username) userObj.username = username;
		if (email) userObj.email = email;
		if (type) userObj.type = type ?? "client";
		else userObj.type = "client";
		if (phone) userObj.phone = phone;
		var user = await usersModel.register(new usersModel(userObj), password);

		const profileObj = {};
		profileObj.user = user._id;
		if (firstname) profileObj.firstname = firstname;
		if (lastname) profileObj.lastname = lastname;
		if (gender) profileObj.gender = gender;
		if (description) profileObj.description = description;
		if (birthdate && dayjs().isValid(birthdate))
			profileObj.birthdate = birthdate;
		if (picture && picture[0].path) profileObj.picture = picture[0].path;

		var profile = await profilesModel.create(profileObj);

		user.profile = profile._id;
		await user.save();
		let subProfilesModel;
		const subProfileObj = {};
		subProfileObj.profile = profile._id;
		subProfileObj.user = user._id;
		if (user.type === "client") subProfilesModel = clientsModel;
		else if (user.type === "therapist") subProfilesModel = therapistsModel;
		var subProfile = await subProfilesModel.create(subProfileObj);

		if (user.type === "client") profile.client = subProfile._id;
		else if (user.type === "therapist") profile.therapist = subProfile._id;
		await profile.save();
		if (user.type === "client") {
			if (therapist)
				if (isValidObjectId(therapist))
					if (await usersModel.exists({ _id: therapist, type: "therapist" })) {
					} else return throwError("Therapist not found!");
				else return throwError("Please enter valid therapist id!");
			else if (req?.user?.type === "therapist") therapist = req.user._id;
			else {
				const therapistExists = await usersModel.findOne({ type: "therapist" });
				if (therapistExists) therapist = therapistExists._id;
				else return next(new Error("No therapist found!"));
			}
			const consultancyObj = {};
			consultancyObj.client = user._id;
			consultancyObj.therapist = therapist;
			await consultanciesModel.create(consultancyObj);
			await therapistsModel.updateOne(
				{ user: therapist },
				{ $inc: { clientsCount: 1 } }
			);
			await clientsModel.updateOne(
				{ user: user._id },
				{ $inc: { therapistsCount: 1 } }
			);
		}
		const userExists = await usersModel.findOne({ _id: user._id }).populate([
			{
				path: "profile",
				populate: { path: "therapist", model: "therapists" },
			},
			{
				path: "profile",
				populate: { path: "client", model: "clients" },
			},
		]);
		if (userExists?.profile?.birthdate) {
			var userDoc = JSON.parse(JSON.stringify(userExists._doc));
			userDoc.profile.age = calculateAge(userDoc.profile.birthdate);
		}
		const token = getToken({ _id: user._id });
		return res.json({
			success: true,
			user: userDoc,
			token,
		});
	} catch (error) {
		if (user) await user.remove();
		if (profile) await profile.remove();
		if (subProfile) await subProfile.remove();
		next(error);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { _id, email, phone } = req.user;
		const query = { status: "active" };
		if (email) query.email = email;
		if (phone) query.phone = phone;
		else if (_id) query._id = _id;
		const userExists = await usersModel.findOne(query).populate([
			{
				path: "profile",
				populate: { path: "therapist", model: "therapists" },
			},
			{
				path: "profile",
				populate: { path: "client", model: "clients" },
			},
		]);
		if (userExists) {
			if (userExists?.profile?.birthdate) {
				var userDoc = JSON.parse(JSON.stringify(userExists._doc));
				userDoc.profile.age = calculateAge(userDoc.profile.birthdate);
			}
		} else return next(new Error("User deleted!"));

		const token = getToken({ _id: userExists._id });
		return res.json({
			success: true,
			user: userDoc,
			token,
		});
	} catch (error) {
		next(error);
	}
};

exports.editUserProfile = async (req, res, next) => {
	try {
		const { user } = req.body;
		if (user) {
			if (req.user.type === "admin" || req.user.type === "therapist")
				if (isValidObjectId(user))
					if (await usersModel.exists({ _id: user })) {
					} else return next(new Error("User not found!"));
				else return next(new Error("Please enter valid user id!"));
			else return next(new Error("Unauthorized as THERAPIST || ADMIN!"));
		}

		const responseUserUpdate = await profilesController.updateUser(
			req,
			res,
			next
		);
		const responseProfileUpdate = await profilesController.updateProfile(
			req,
			res,
			next
		);

		const userExists = await usersModel
			.findOne({ _id: user ?? req.user._id })
			.populate([
				{
					path: "profile",
					populate: { path: "therapist", model: "therapists" },
				},
				{
					path: "profile",
					populate: { path: "client", model: "clients" },
				},
			]);

		if (userExists?.profile?.birthdate) {
			var userDoc = JSON.parse(JSON.stringify(userExists._doc));
			userDoc.profile.age = calculateAge(userDoc.profile.birthdate);
		}

		return res.json({
			success: responseProfileUpdate && responseUserUpdate,
			user: userDoc,
		});
	} catch (error) {
		next(error);
	}
};

exports.setState = async (user, state) => {
	try {
		if (!user) throw new Error("Please enter user id!");
		if (!isValidObjectId(user)) throw new Error("Please enter valid user id!");
		if (state) {
			const update = await usersModel.updateOne(
				{ _id: user },
				{ state },
				{
					useFindAndModify: false,
					new: true,
					runValidators: true,
				}
			);
			return { success: update.modifiedCount == 0 ? false : true };
		}
		throw new Error("Please enter user state!");
	} catch (error) {
		throw error;
	}
};

exports.checkUserPhoneExists = async (req, res, next) => {
	try {
		const userExists = await usersModel.exists({ phone: req.body.phone });
		if (userExists) {
			next();
		} else next(new Error("User does not exist!"));
	} catch (error) {
		next(error);
	}
};

exports.getUser = async (req, res, next) => {
	try {
		let { user } = req.params;
		const { isMe } = req.query;
		if (isMe) if (req?.user?._id) user = req.user._id;
		if (user)
			if (isValidObjectId(user)) {
				const userExists = await usersModel.findOne({ _id: user }).populate([
					{
						path: "profile",
						populate: { path: "therapist", model: "therapists" },
						// populate: { path: "subProfile", model: "subProfiles", select: "_id" },
					},
					{
						path: "profile",
						populate: { path: "client", model: "clients" },
					},
				]);
				if (userExists) {
					if (userExists?.profile?.birthdate) {
						var userDoc = JSON.parse(JSON.stringify(userExists._doc));
						userDoc.profile.age = calculateAge(userDoc.profile.birthdate);
					}
					return res.json({
						success: true,
						user: userDoc,
					});
				} else return next(new Error("User not found!"));
			} else return next(new Error("Please enter valid user id!"));
		else return next(new Error("Please enter user id!"));
	} catch (error) {
		next(error);
	}
};

exports.emailResetPassword = async (req, res, next) => {
	try {
		const { email } = req.body;
		const userExists = await usersModel.findOne({ email });
		if (userExists) {
		} else return next(new Error("User with given email doesn't exist!"));

		let passwordTokenExists = await passwordTokensModel.findOne({
			user: userExists._id,
		});
		if (passwordTokenExists) {
		} else {
			const passwordTokenObj = {};
			passwordTokenObj.user = userExists._id;
			passwordTokenObj.token = getToken({ _id: userExists._id });
			passwordTokenExists = await new passwordTokensModel(
				passwordTokenObj
			).save();
		}

		const link = `${process.env.BASE_URL}password/email?user=${userExists._id}&token=${passwordTokenExists.token}`;
		await sendEmail(userExists.email, "Password reset", link);

		res.json({
			success: true,
			message: "Password reset link sent to your email address!",
		});
	} catch (error) {
		return next(error);
	}
};

exports.resetPassword = async (req, res, next) => {
	try {
		const { password, user, token } = req.body;

		const userExists = await usersModel.findById(user);
		if (userExists) {
		} else return next(new Error("Invalid link!"));

		const passwordTokenExists = await passwordTokensModel.findOne({
			user,
			token,
		});
		if (passwordTokenExists) {
		} else return next(new Error("Invalid or expired link !"));

		await userExists.setPassword(password);
		await userExists.save();
		await passwordTokenExists.delete();

		res.json({ success: true, message: "Password reset sucessfully." });
	} catch (error) {
		return next(error);
	}
};

exports.getAllUsers = async (req, res, next) => {
	try {
		let { q, page, limit, status, type } = req.query;
		const { _id } = req.user;
		const query = {};
		query._id = { $ne: _id };
		page = Number(page);
		limit = Number(limit);
		if (!limit) limit = 10;
		if (!page) page = 1;
		if (req.user.type === "admin") {
			if (type) query.type = type;
		} else query.type = "client";
		if (req.user.type === "admin") {
			if (status) query.status = status;
		} else query.status = { $ne: "deleted" };
		if (q && q.trim() !== "") {
			var wildcard = [
				{
					$regexMatch: {
						input: "$firstname",
						regex: q,
						options: "i",
					},
				},
				{
					$regexMatch: {
						input: "$lastname",
						regex: q,
						options: "i",
					},
				},
				{
					$regexMatch: {
						input: "$description",
						regex: q,
						options: "i",
					},
				},
			];
		}
		const aggregation = [
			{ $match: query },
			{ $project: { email: 1, phone: 1, profile: 1, status: 1 } },
			{
				$lookup: {
					from: "profiles",
					let: { profile: "$profile" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$and: [{ $eq: ["$$profile", "$_id"] }],
										},
										{
											$or: wildcard ?? {},
										},
									],
								},
							},
						},
						{
							$project: {
								firstname: 1,
								lastname: 1,
								gender: 1,
								birthdate: 1,
								age: {
									$floor: {
										$divide: [
											{ $subtract: [new Date(), "$birthdate"] },
											365 * 24 * 60 * 60 * 1000,
										],
									},
								},
								description: 1,
								picture: 1,
								client: 1,
								therapist: 1,
							},
						},
					],
					as: "profile",
				},
			},
			{ $unwind: { path: "$profile" } },
		];

		const users = await usersModel
			.aggregate(aggregation)
			.skip((page - 1) * limit)
			.limit(limit)
			.sort({ "profile.firstname": 1 });

		aggregation.push(
			...[
				{ $group: { _id: null, count: { $sum: 1 } } },
				{ $project: { _id: 0 } },
			]
		);

		const totalCount = await usersModel.aggregate(aggregation);

		return res.status(200).json({
			success: true,
			totalCount: totalCount[0]?.count ?? 0,
			totalPages: Math.ceil((totalCount[0]?.count ?? 0) / limit),
			users,
		});
	} catch (error) {
		next(error);
	}
};

const calculateAge = (birthdate) => {
	return Math.floor(
		(new Date() - new Date(birthdate)) / 1000 / 60 / 60 / 24 / 365
	);
};
