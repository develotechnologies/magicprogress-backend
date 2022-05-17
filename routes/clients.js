const express = require("express");
const passport = require("passport");
const router = express.Router();

const usersController = require("../controllers/users");
const {
	verifyToken,
	verifyUser,
} = require("../middlewares/public/authenticator");
const { verifyTherapist } = require("../middlewares/private/authenticator");
const { uploadTemporary } = require("../middlewares/public/uploader");
const { resizeProfilePicture } = require("../middlewares/private/imageResizer");
const { uploadPicture } = require("../middlewares/private/filesUploader");

router
	.route("/")
	.post(
		verifyToken,
		verifyTherapist,
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
	.get(verifyToken, verifyTherapist, usersController.getAllUsers);

router.get("/:user", verifyToken, verifyUser, usersController.getUser);

module.exports = router;
