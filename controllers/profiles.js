const moment = require("moment");
const { isValidObjectId } = require("mongoose");

const { usersModel, profilesModel } = require("../models");
const { deleteProfilePicture } = require("../middlewares/private/deleter");

exports.updateProfile = async (req, res, next) => {
	try {
		const {
			user,
			firstname,
			lastname,
			longitude,
			latitude,
			address,
			removePicture,
		} = req.body;
		const { picture } = req.files || {};
		const profileObj = {};

		if (firstname) profileObj.firstname = firstname;
		if (lastname) profileObj.lastname = lastname;
		if (address) profileObj.address = address;
		if (Number(longitude) && Number(latitude))
			profileObj.location = {
				type: "Point",
				coordinates: [Number(longitude), Number(latitude)],
			};
		if (picture && picture[0].path) {
			if (req.user.profile.picture)
				deleteProfilePicture(req.user.profile.picture);
			profileObj.picture = picture[0].path;
		}
		if (removePicture === "true") {
			deleteProfilePicture(req.user.profile.picture);
			profileObj.picture = "";
		}
		const response = await profilesModel.updateOne(
			{ user: user ?? req.user._id },
			profileObj,
			{
				useFindAndModify: false,
				new: true,
				runValidators: true,
			}
		);
		return response.modifiedCount === 0 ? false : true;
	} catch (error) {
		throw error;
	}
};

exports.updateUser = async (req, res, next) => {
	try {
		const { user, phone, status, fcm, device, email, newPassword } = req.body;
		const userObj = {};
		if (phone) userObj.phone = phone;
		if (status) userObj.status = status;
		if (email) userObj.email = email;
		const existsUser = await usersModel.findOne({ _id: req.user._id });
		if (newPassword) {
			await existsUser.setPassword(newPassword);
		}
		if (fcm && device) {
			let alreadyExists = false;
			existsUser.fcms.forEach((element) => {
				if (element.device === device) {
					alreadyExists = true;
					element.fcm = fcm;
				}
			});
			if (!alreadyExists) existsUser.fcms.push({ device, fcm });
		}
		await existsUser.save();
		const response = await usersModel.updateOne(
			{ _id: user ?? req.user._id },
			userObj,
			{
				useFindAndModify: false,
				new: true,
				runValidators: true,
			}
		);
		return response.modifiedCount === 0 ? false : true;
	} catch (error) {
		throw error;
	}
};
