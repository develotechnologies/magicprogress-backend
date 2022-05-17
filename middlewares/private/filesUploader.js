const s3BucketManager = require("../public/s3BucketManager");

exports.uploadPicture = async (req, res, next) => {
	try {
		const { picture } = req.files || {};

		if (picture) {
			const path = await s3BucketManager.upload(picture);
			picture[0].path = path;
			next();
		} else {
			next();
		}
	} catch (error) {
		next(error);
	}
};

exports.uploadImages = async (req, res, next) => {
	try {
		const { images } = req.files || {};
		if (images && images.length > 0) {
			for (let i = 0; i < images.length; i++) {
				const path = await s3BucketManager.upload(images[i]);
				images[i].path = path;
			}
			next();
		} else {
			next();
		}
	} catch (error) {
		next(error);
	}
};

exports.uploadAttachments = async (req, res, next) => {
	try {
		const { attachments } = req.files || {};
		if (attachments && attachments.length > 0) {
			for (let i = 0; i < attachments.length; i++) {
				const path = await s3BucketManager.upload(attachments[i]);
				attachments[i].path = path;
			}
			next();
		} else {
			next();
		}
	} catch (error) {
		next(error);
	}
};
