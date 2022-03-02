const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const profiles = new Schema(
	{
		firstname: {
			type: String,
			trim: true,
			required: true,
			index: true,
		},
		lastname: {
			type: String,
			trim: true,
			required: true,
			index: true,
		},
		location: {
			type: {
				type: String,
				enum: ["Point"],
				default: "Point",
				required: true,
			},
			coordinates: {
				type: [Number, Number],
				default: [0, 0],
				required: true,
			},
		},
		birthdate: {
			type: Date,
			required: true,
		},
		address: {
			type: String,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		gender: {
			type: String,
			enum: ["male", "female", "other"],
			required: true,
			trim: true,
		},
		picture: {
			type: String,
			trim: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
			index: true,
		},
		therapist: {
			type: Schema.Types.ObjectId,
			ref: "therapists",
			index: true,
		},
		client: {
			type: Schema.Types.ObjectId,
			ref: "clients",
			index: true,
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model("profiles", profiles);
