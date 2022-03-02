const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replies = new Schema(
	{
		comment: {
			type: Schema.Types.ObjectId,
			ref: "comments",
			required: true,
			index: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
			index: true,
		},
		text: {
			type: String,
			trim: true,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("replies", replies);
