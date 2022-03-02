const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const comparisons = new Schema(
	{
		visit1: {
			type: Schema.Types.ObjectId,
			ref: "visits",
			required: true,
			index: true,
		},
		visit2: {
			type: Schema.Types.ObjectId,
			ref: "visits",
			required: true,
			index: true,
		},
		commentsCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("comparisons", comparisons);
