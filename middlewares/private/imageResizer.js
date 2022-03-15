const {
	resizeImagesWithThumbnails,
	resizeImagesThumbnails,
} = require("../public/imageResizer");

const {
	PROFILE_PICTURES_DIRECTORY,
	VISITS_IMAGES_DIRECTORY,
} = require("../../configs/directories");

exports.resizeProfilePicture = async (req, res, next) => {
	try {
		const { picture } = req.files || {};

		if (picture) {
			const PATH = PROFILE_PICTURES_DIRECTORY;
			const images = picture;

			// imagesData contains 1.image_name 2.image_path
			const imagesData = { images, PATH };

			req.files.picture = await resizeImagesWithThumbnails(imagesData);

			next();
		} else {
			next();
		}
	} catch (error) {
		next(error);
	}
};

exports.resizeVisitImages = async (req, res, next) => {
	try {
		const { images } = req.files || {};

		if (images) {
			const PATH = VISITS_IMAGES_DIRECTORY;

			// imagesData contains 1.image_name 2.image_path
			const imagesData = { images, PATH };

			req.files.images = await resizeImagesThumbnails(imagesData);

			next();
		} else {
			next();
		}
	} catch (error) {
		next(error);
	}
};
