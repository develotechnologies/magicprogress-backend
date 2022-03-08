const express = require("express");
const router = express.Router();

const { VISITS_IMAGES_DIRECTORY } = require("../configs/directories");
const visitsController = require("../controllers/visits");
const {
	verifyToken,
	verifyUser,
} = require("../middlewares/public/authenticator");
const { upload } = require("../middlewares/public/uploader");

router
	.route("/")
	.post(
		verifyToken,
		verifyUser,
		upload(VISITS_IMAGES_DIRECTORY).fields([{ name: "images", maxCount: 4 }]),
		visitsController.addVisit
	)
	.get(verifyToken, verifyUser, visitsController.getAllVisits);

router
	.route("/comparisons")
	.post(verifyToken, verifyUser, visitsController.compareVisits)
	.get(verifyToken, verifyUser, visitsController.getAllComparisons);

router.get("/:visit", verifyToken, verifyUser, visitsController.getVisit);

module.exports = router;
