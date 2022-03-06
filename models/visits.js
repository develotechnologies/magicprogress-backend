const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const visits = new Schema(
	{
		client: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
			index: true,
		},
		consultancy: {
			type: Schema.Types.ObjectId,
			ref: "consultancies",
			required: true,
			index: true,
		},
		number: {
			type: Number,
			required: true,
			index: true,
		},
		title: {
			type: String,
			trim: true,
			required: true,
			index: true,
		},
		frontImage: {
			type: String,
			trim: true,
			required: true,
		},
		rightImage: {
			type: String,
			trim: true,
			required: true,
		},
		leftImage: {
			type: String,
			trim: true,
			required: true,
		},
		backImage: {
			type: String,
			trim: true,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("visits", visits);
