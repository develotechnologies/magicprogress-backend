const moment = require("moment");
const { isValidObjectId } = require("mongoose");

const { getToken } = require("../middlewares/public/authenticator");
const {
	usersModel,
	profilesModel,
	therapistsModel,
	clientsModel,
} = require("../models");
const profilesController = require("./profiles");

exports.signup = async (req, res, next) => {
	try {
		let existsUser, existsProfile, existsSubProfile;
		const { username, email, password, phone, type } = req.body;
		const { firstname, lastname, gender, birthdate, description } = req.body;
		const { picture } = req.files || {};
		const userObj = {};
		if (username) userObj.username = username;
		if (email) userObj.email = email;
		if (type) userObj.type = type;
		if (phone) userObj.phone = phone;
		await usersModel.register(
			new usersModel(userObj),
			password,
			async (error, user) => {
				if (error) {
					if (existsUser) await existsUser.remove();
					return next(error);
				} else if (user) {
					existsUser = user;
					const profileObj = {};
					profileObj.user = user._id;
					if (firstname) profileObj.firstname = firstname;
					if (lastname) profileObj.lastname = lastname;
					if (gender) profileObj.gender = gender;
					if (description) profileObj.description = description;
					if (birthdate && moment().isValid(birthdate))
						profileObj.birthdate = birthdate;
					if (picture && picture[0].path) profileObj.picture = picture[0].path;

					const abc = profilesModel.create(profileObj, async (err, profile) => {
						if (err) {
							if (existsProfile) await existsProfile.remove();
							if (user) await user.remove();
							return next(err);
						} else if (profile) {
							existsProfile = profile;
							user.profile = profile._id;
							await user.save();
							// ERROR CATCH
							// moment.isValid(birthdate);
							let subProfileModel;
							const subProfileObj = {};
							subProfileObj.profile = profile._id;
							if (user.type === "client") subProfileModel = clientsModel;
							else if (user.type === "therapist")
								subProfileModel = therapistsModel;
							subProfileModel.create(subProfileObj, async (e, subProfile) => {
								if (e) {
									if (subProfile) await subProfile.remove();
									await user.remove();
									await profile.remove();
									return next(e);
								} else if (subProfile) {
									if (user.type === "client") profile.client = subProfile._id;
									else if (user.type === "therapist")
										profile.therapist = subProfile._id;
									await profile.save();
								}
							});
						}
						var token = getToken({ _id: user._id });
						return res.json({
							success: true,
							user: await usersModel.findOne({ _id: user._id }).populate([
								{
									path: "profile",
									populate: { path: "therapist", model: "therapists" },
								},
								{
									path: "profile",
									populate: { path: "client", model: "clients" },
								},
							]),
							token,
						});
					});
				}
			}
		);
	} catch (error) {
		next(error);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { _id, phone } = req.user;
		const query = { status: "active" };
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
		} else return next(new Error("User deleted!"));

		const token = getToken({ _id: userExists._id });
		return res.json({
			success: true,
			user: userExists,
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
			if (req.user.type === "admin")
				if (isValidObjectId(user))
					if (await usersModel.exists({ _id: user })) {
					} else return next(new Error("User not found!"));
				else return next(new Error("Please enter valid user id!"));
			else return next(new Error("Unauthorized as ADMIN!"));
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
		return res.json({
			success: responseProfileUpdate && responseUserUpdate,
			user: await usersModel.findOne({ _id: req.user._id }).populate([
				{
					path: "profile",
					populate: { path: "therapist", model: "therapists" },
				},
				{
					path: "profile",
					populate: { path: "client", model: "clients" },
				},
			]),
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
		const exists = await usersModel.exists({ phone: req.body.phone });
		if (exists) {
			next();
		} else next(new Error("User does not exist!"));
	} catch (error) {
		next(error);
	}
};

exports.getUser = async (req, res, next) => {
	try {
		const { user } = req.params;
		if (user)
			if (isValidObjectId(user)) {
				const response = await usersModel.findOne({ _id: user }).populate([
					{
						path: "profile",
						populate: { path: "therapist", model: "therapists" },
					},
					{
						path: "profile",
						populate: { path: "client", model: "clients" },
					},
				]);
				if (response)
					return res.json({
						success: "true",
						user: response,
					});
				else return next(new Error("User not found!"));
			} else return next(new Error("Please enter valid user id!"));
		else return next(new Error("Please enter user id!"));
	} catch (error) {
		next(error);
	}
};

exports.getAllUsers = (req, res, next) => {
	let { q, page, limit, type, status } = req.query;
	const { _id } = req.user;
	const query = {};
	if (type) query.type = type;
	if (status) query.status = status;
	if (q) {
		query.$or = [
			{ username: { $regex: q, $options: "i" } },
			{ phone: { $regex: q, $options: "i" } },
		];
	}
	query._id = { $ne: _id };
	page = Number(page);
	limit = Number(limit);
	if (!limit) limit = 10;
	if (!page) page = 1;
	try {
		Promise.all([
			usersModel.find({ ...query }).count(),
			usersModel
				.find({ ...query })
				.skip((page - 1) * limit)
				.limit(limit),
		]).then(([total, users]) => {
			const totalPages = Math.ceil(total / limit);
			return res
				.status(400)
				.json({ success: true, users, currentPage: page, totalPages });
		});
	} catch (error) {
		next(error);
	}
};
