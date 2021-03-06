const AWS = require("aws-sdk");
var uuid = require("uuid").v4;
const mime = require("mime-types");
const { AWS_NAME, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION } = process.env;
const s3Client = new AWS.S3({
	apiVersion: "2006-03-01",
	accessKeyId: AWS_ACCESS_KEY,
	secretAccessKey: AWS_SECRET_KEY,
	// ServerSideEncryption: "AES256",
	region: AWS_REGION,
});

exports.awsUploadSingle = async (req, res, next) => {
	var { file } = req;
	if (file) {
		const path = await upload(file);
		req.filePath = path;
		next();
	} else {
		req.filePath = null;
		next();
	}
};
exports.awsUploadArray = async (req, res, next) => {
	var { files } = req;
	if (files && files.length > 0) {
		var array = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const path = await upload(file);
			array.push(path);
			if (i == files.length - 1) {
				req.filePaths = array;
				next();
			}
		}
	} else {
		req.filePaths = [];
		next();
	}
};
exports.deleteAwsObject = (url) => {
	var url1 = String(url).split("/");
	var len = String(url).split("/").length;
	const uploadParams = {
		Bucket: AWS_NAME,
		Key: url1[len - 1], // pass key
	};
	s3Client.deleteObject(uploadParams, async (err, data) => {
		if (err) {
			console.log("err" + err);
		} else {
			console.log("deleted" + JSON.stringify(data));
		}
	});
};

exports.upload = async (file, directory) => {
	const fileObj = Array.isArray(file) ? file[0] : file;
	let file_name = uuid();
	const fileExtension = mime.extension(fileObj.mimetype);
	file_name += "." + fileExtension;
	if (directory) file_name = `${directory}/${file_name}`;
	const uploadParams = {
		Bucket: AWS_NAME,
		Key: file_name, // pass key
		ContentType: fileObj.mimetype,
		Body: fileObj.buffer, // pass file body
	};
	return await s3Client
		.upload(uploadParams)
		.promise()
		.then((data) => {
			return data.Key;
		})
		.catch((e) => {
			console.log("e", e);
		});
};
