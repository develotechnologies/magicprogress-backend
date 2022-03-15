const express = require("express");
const router = express.Router();

const visitsController = require("../controllers/visits");
const { resizeVisitImages } = require("../middlewares/private/imageResizer");
const {
	verifyToken,
	verifyUser,
} = require("../middlewares/public/authenticator");
const { uploadTemporary } = require("../middlewares/public/uploader");

router
	.route("/")
	.post(
		verifyToken,
		verifyUser,
		uploadTemporary.fields([{ name: "images", maxCount: 4 }]),
		resizeVisitImages,
		visitsController.addVisit
	)
	.get(verifyToken, verifyUser, visitsController.getAllVisits);

router
	.route("/comparisons")
	.post(verifyToken, verifyUser, visitsController.compareVisits)
	.get(verifyToken, verifyUser, visitsController.getAllComparisons);

router.get("/:visit", verifyToken, verifyUser, visitsController.getVisit);

module.exports = router;
