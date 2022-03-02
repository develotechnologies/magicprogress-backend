const admin = require("firebase-admin");

const serviceAccount = require("../services/magicprogress-2cf22-firebase-adminsdk-xyykx-fb0e51488c.json");

const connection = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

exports.sendNotification = async (fcm, title, body, data) => {
	try {
		const payload = {
			notification: {
				title,
				body,
				sound: "default",
			},
			data,
		};
		connection
			.messaging()
			.sendToDevice([fcm], payload)
			.then((res) => console.log(res))
			.catch((error) => console.log(error));
	} catch (error) {
		console.error(error);
	}
};
