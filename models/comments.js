const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const comments = new Schema(
	{
		comparison: {
			type: Schema.Types.ObjectId,
			ref: "comparisons",
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
		repliesCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("comments", comments);
