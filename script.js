const mongoose = require("mongoose");
const moment = require("moment");

const {
	comparisonsModel,
	commentsModel,
	usersModel,
	visitsModel,
	clientsModel,
	therapistsModel,
	profilesModel,
	consultanciesModel,
} = require("./models");
const backup = require("./backup.json");
const Fs = require("fs");
const Path = require("path");
const Axios = require("axios");

let url = "";
const defaultFRONT = "2b68ff4a-aec4-42b0-9ce4-01b6820da291.jpeg";
const defaultBACK = "3c1cb82b-6498-41ba-a1b1-a73c18a837a1.jpeg";
const defaultLEFT = "48e3a351-277d-4085-a30a-34e5de37b68e.jpeg";
const defaultRIGHT = "4d135da5-4e4d-429f-83fa-f8858dbf8f3b.jpeg";

const therapistUserObj = {
	email: "therapist@gmail.com",
	phone: "+923118048995",
	fcms: [
		{
			fcm: "cgo2n8EMUUv5oMydoYHlVa:APA91bE07_OVV5vg4mG27TV-zU_2gjerqy3koerSZBmLXUUehNATVWmSCO0iFjweaZNSyF0rx95J8qJdcqqu2wNlfkA-G4Mma-IGm3TK2HC425Fe2EwdJl3aTdRQy9idd1ejJzbWBdwx",
			device: "device_0",
		},
	],
	type: "therapist",
};
let therapistImage =
	"https://firebasestorage.googleapis.com/v0/b/magicprogress-2cf22.appspot.com/o/AppImages%2F701A9731.jpg?alt=media&token=2448bb7b-2414-47f0-a533-0f83d3870e2b";

url = therapistImage.split("?")[0];
url = url.split("/").pop();
const therapistProfileObj = {
	firstname: "Michelle",
	lastname: "Kanner",
	gender: "female",
	birthdate: "Mon Mar 09 1992",
	description: "Doctor Of Physical Therapy",
	picture: url,
};

async function func() {
	try {
		await mongoose.connect(
			"mongodb+srv://magic_progress:magic_progress@cluster0.ig5hr.mongodb.net/sandbox?retryWrites=true&w=majority",
			{
				useNewUrlParser: true,
				useUnifiedTopology: true,
			}
		);
		// const therapistUser = await usersModel.register(
		// 	new usersModel(therapistUserObj),
		// 	"Appuser123"
		// );
		// const therapistPath = Path.resolve(
		// 	__dirname,
		// 	"public",
		// 	"sandbox",
		// 	"images",
		// 	"profile_pictures",
		// 	url
		// );
		// await downloadImage(therapistImage, therapistPath);
		// const therapistProfile = await profilesModel.create({
		// 	user: therapistUser._id,
		// 	...therapistProfileObj,
		// });

		// const therapistTherapist = await therapistsModel.create({
		// 	user: therapistUser._id,
		// 	profile: therapistProfile._id,
		// });
		// therapistUser.profile = therapistProfile._id;
		// therapistProfile.therapist = therapistTherapist._id;
		// await therapistUser.save();
		// await therapistProfile.save();
		const therapistUser = {};
		therapistUser._id = mongoose.Types.ObjectId("6230252f636ac17a503f8a9c");

		const therapistExists = await usersModel
			.findOne({ type: "therapist" })
			.populate("profile");

		const {
			__collections__: { DevelopmentUsers },
		} = backup;
		var arr = Object.values(DevelopmentUsers).map((i) => i);
		console.log(arr.length, "accounts creation started!");
		for (let i = 0; i < arr.length; i++) {
			const element = arr[i];
			const {
				email,
				phone,
				fcmToken,
				name: firstname,
				familyName: lastname,
				age,
				description,
				address,
				gender,
				userImage,
				password,
				Visits,
				reviews,
				isBlocked,
			} = element;
			console.log(email, "account creation started...");

			var userObj = {
				type: "client",
				status: "active",
				isPasswordSet: true,
				email,
				phone,
				status: isBlocked ? "blocked" : "active",
			};
			if (fcmToken)
				userObj.fcm = [{ device: `device_${i + 1}`, fcm: fcmToken }];
			var user = await usersModel.register(
				new usersModel(userObj),
				password.toString()
			);
			if (userImage) {
				url = userImage.split("?")[0];
				url = url.split("/").pop();
				const path = Path.resolve(
					__dirname,
					"public",
					"sandbox",
					"images",
					"profile_pictures",
					url
				);
				await downloadImage(userImage, path);
			}
			var profileObj = {
				user: user._id,
				firstname: firstname ?? "undefined",
				lastname: !lastname || lastname == "" ? "undefined" : lastname,
				birthdate: moment().subtract(Number(age) ?? 0, "year"),
				description,
				address,
				gender: gender == "Male" ? "male" : "female",
				picture: url,
			};
			var profile = await profilesModel.create(profileObj);
			user.profile = profile._id;
			await user.save();
			var client = await clientsModel.create({
				profile: profile._id,
				user: user._id,
			});
			profile.client = client._id;
			await profile.save();

			const consultancyObj = {};
			consultancyObj.client = user._id;
			consultancyObj.therapist = therapistUser._id;
			const consultancyExists = await consultanciesModel.create(consultancyObj);
			await therapistsModel.updateOne(
				{ user: therapistUser._id },
				{ $inc: { clientsCount: 1 } }
			);
			await clientsModel.updateOne(
				{ user: user._id },
				{ $inc: { therapistsCount: 1 } }
			);

			if (Visits && Array.isArray(Visits)) {
				for (let j = 0; j < Visits.length; j++) {
					const visit = Visits[j];
					const { time, visitImages } = visit;
					if (
						visitImages &&
						Array.isArray(visitImages) &&
						visitImages.length >= 4
					) {
						const visitObj = {};
						visitObj.consultancy = consultancyExists._id;
						visitObj.number = j + 1;
						visitObj.title = `Visit ${j + 1}`;
						visitObj.client = user._id;
						if (time) visitObj.createdAt = new Date(time);
						if (
							visitImages &&
							Array.isArray(visitImages) &&
							visitImages.length >= 4
						) {
							url = visitImages[0].split("?")[0];
							url = url.split("/").pop();
							let path = Path.resolve(
								__dirname,
								"public",
								"sandbox",
								"images",
								"visits",
								url
							);
							isError = false;
							try {
								await downloadImage(visitImages[0], path);
							} catch (error) {
								isError = true;
								visitObj.frontImage = defaultFRONT;
							}
							if (!isError) visitObj.frontImage = url;

							url = visitImages[1].split("?")[0];
							url = url.split("/").pop();
							path = Path.resolve(
								__dirname,
								"public",
								"sandbox",
								"images",
								"visits",
								url
							);
							isError = false;
							try {
								await downloadImage(visitImages[1], path);
							} catch (error) {
								isError = true;
								visitObj.rightImage = defaultRIGHT;
							}
							if (!isError) visitObj.rightImage = url;

							url = visitImages[2].split("?")[0];
							url = url.split("/").pop();
							path = Path.resolve(
								__dirname,
								"public",
								"sandbox",
								"images",
								"visits",
								url
							);
							isError = false;
							try {
								await downloadImage(visitImages[2], path);
							} catch (error) {
								isError = true;
								visitObj.leftImage = defaultLEFT;
							}
							if (!isError) visitObj.leftImage = url;

							url = visitImages[3].split("?")[0];
							url = url.split("/").pop();
							path = Path.resolve(
								__dirname,
								"public",
								"sandbox",
								"images",
								"visits",
								url
							);
							isError = false;
							try {
								await downloadImage(visitImages[3], path);
							} catch (error) {
								isError = true;
								visitObj.backImage = defaultBACK;
							}
							if (!isError) visitObj.backImage = url;
						}
						await visitsModel.create(visitObj);
						await consultanciesModel.updateOne(
							{ _id: consultancyExists._id },
							{ $inc: { visitsCount: 1 } }
						);
						console.log("visit", j + 1, "of", Visits.length, "added!");
					}
				}
			}
			const clientExists = await usersModel
				.findOne({ email })
				.populate("profile");

			// const consultancyExists = await consultanciesModel.findOne({
			// 	client: clientExists._id,
			// 	therapist: therapistExists._id,
			// });

			if (consultancyExists) {
				let query = {};
				query.consultancy = consultancyExists._id;
				if (reviews && Array.isArray(reviews)) {
					for (let j = 0; j < reviews.length; j++) {
						const review = reviews[j];
						const {
							comment: commentText,
							commentDate: commentCreation,
							name: commenterName,
							visits: vistsTitle,
						} = review;
						const comparisonObj = {};
						if (vistsTitle) {
							var titleV1 = vistsTitle.split("&")[0].trim();
							var titleV2 = vistsTitle.split("&")[1].trim();
						}
						if (titleV1) query.title = titleV1;
						else query.title = "Visit 1";
						let visit1Exists = await visitsModel.findOne(query);
						if (titleV2) query.title = titleV2;
						else query.title = "Visit 2";
						let visit2Exists = await visitsModel.findOne(query);
						if (visit1Exists) {
						} else {
							if (visit2Exists) visit1Exists = visit2Exists;
						}
						if (visit2Exists) {
						} else {
							if (visit1Exists) visit2Exists = visit1Exists;
						}
						query = {
							$or: [
								{
									$and: [
										{ visit1: visit1Exists._id },
										{ visit2: visit2Exists._id },
									],
								},
								{
									$and: [
										{ visit1: visit2Exists._id },
										{ visit2: visit1Exists._id },
									],
								},
							],
						};
						const comparisonExists = await comparisonsModel.findOne(query);
						if (comparisonExists) {
						} else {
							const visitExists = await visitsModel.findOne({
								$or: [{ _id: visit1Exists._id }, { _id: visit2Exists._id }],
							});
							comparisonObj.visit1 = visit1Exists._id;
							comparisonObj.visit2 = visit2Exists._id;
							comparisonObj.client = visitExists.client;
							var comparison = await comparisonsModel.create(comparisonObj);
						}
						const commentObj = {};
						commentObj.text = commentText ?? "undefined";
						commentObj.user =
							commenterName === clientExists.profile.firstname
								? clientExists._id
								: therapistExists._id;
						commentObj.comparison = comparisonExists ?? comparison;
						if (commentCreation)
							commentObj.createdAt = moment(
								commentCreation,
								"MMMM Do YYYY[,] hh:mm A"
							).toDate();
						await commentsModel.create(commentObj);
						await comparisonsModel.updateOne(
							{
								_id: comparisonExists ? comparisonExists._id : comparison._id,
							},
							{ $inc: { commentsCount: 1 } }
						);
						console.log("review", j + 1, "of", reviews.length, "added!");
					}
				}
			} else console.log(`Consultancy not found for ${email}!`);

			console.log("account", i + 1, "of", arr.length, "created!");
		}
		console.log(arr.length, "accounts created successfully!");
	} catch (error) {
		console.log("------------------", error);
		// throw error;
	}
}

async function downloadImage(url, path) {
	const writer = Fs.createWriteStream(path);
	const response = await Axios({
		url,
		method: "GET",
		responseType: "stream",
	});
	await response.data.pipe(writer);
	return await new Promise((resolve, reject) => {
		writer.on("finish", resolve);
		writer.on("error", reject);
	});
}

func();
