const express = require("express");
const router = express.Router();

const commentsController = require("../controllers/comments");
const {
	verifyToken,
	verifyUser,
} = require("../middlewares/public/authenticator");

router
	.route("/")
	.post(verifyToken, verifyUser, commentsController.addComment)
	.get(verifyToken, verifyUser, commentsController.getComments);

router
	.route("/replies")
	.post(verifyToken, verifyUser, commentsController.addReply)
	.get(verifyToken, verifyUser, commentsController.getReplies);

module.exports = router;
