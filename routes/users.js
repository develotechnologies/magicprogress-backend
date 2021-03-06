const express = require("express");
const passport = require("passport");
const router = express.Router();

const usersController = require("../controllers/users");
const notificationsController = require("../controllers/notifications");
const consultanciesController = require("../controllers/consultancies");
const {
	verifyToken,
	verifyUser,
	verifyAdmin,
	alterLogin,
	verifyUserToken,
} = require("../middlewares/public/authenticator");
const { sendOtp, verifyOtp } = require("../middlewares/public/otpManager");
const { uploadTemporary } = require("../middlewares/public/uploader");
const { resizeProfilePicture } = require("../middlewares/private/imageResizer");
const { uploadPicture } = require("../middlewares/private/filesUploader");

router
	.route("/")
	.post(
		uploadTemporary.fields([{ name: "picture", maxCount: 1 }]),
		uploadPicture,
		usersController.signup
	)
	.put(
		verifyToken,
		verifyUser,
		uploadTemporary.fields([{ name: "picture", maxCount: 1 }]),
		uploadPicture,
		usersController.editUserProfile
	)
	.get(verifyToken, verifyAdmin, usersController.getAllUsers);

router
	.route("/login")
	.post(alterLogin, passport.authenticate("local"), usersController.login)
	.put(
		verifyToken,
		verifyOtp,
		usersController.checkUserPhoneExists,
		usersController.login
	);
router.put(
	"/phone",
	verifyToken,
	verifyOtp,
	verifyUserToken,
	usersController.editUserProfile
);
router.put(
	"/password",
	alterLogin,
	passport.authenticate("local"),
	usersController.editUserProfile
);

router.route("/otp").post(verifyToken, verifyUser, sendOtp).put(sendOtp);

router
	.route("/password/email")
	.post(usersController.emailResetPassword)
	.put(usersController.resetPassword);

router
	.route("/consultancies")
	.post(verifyToken, verifyUser, consultanciesController.addConsultancy)
	.get(verifyToken, verifyUser, consultanciesController.getConsultancies);

router.get(
	"/notifications",
	verifyToken,
	verifyUser,
	notificationsController.getAllNotifications
);

router.get("/:user", verifyToken, verifyUser, usersController.getUser);

module.exports = router;
