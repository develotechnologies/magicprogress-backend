const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notifications = new Schema(
	{
		type: {
			type: String,
			enum: ["new-comment", "new-message"],
			required: true,
			index: true,
		},

		text: {
			type: String,
			default: "",
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "users",
			index: true,
		},
		therapist: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "users",
			index: true,
		},
		client: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "users",
			index: true,
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model("notifications", notifications);
