const express = require("express");
const router = express.Router();

const messagesController = require("../controllers/messages");
const {
	verifyToken,
	verifyUser,
} = require("../middlewares/public/authenticator");

const { uploadTemporary } = require("../middlewares/public/uploader");
const { ATTACHMENTS_DIRECTORY } = require("../configs/directories");
const { uploadAttachments } = require("../middlewares/private/filesUploader");

router
	.route("/")
	.post(
		verifyToken,
		verifyUser,

		uploadTemporary.fields([{ name: "attachments", maxCount: 4 }]),
		uploadAttachments,
		messagesController.send
	)
	.get(verifyToken, verifyUser, messagesController.chat)
	.put(verifyToken, verifyUser, messagesController.updateMessage);
router.get(
	"/chatters",
	verifyToken,
	verifyUser,
	messagesController.getChatters
);

module.exports = router;
