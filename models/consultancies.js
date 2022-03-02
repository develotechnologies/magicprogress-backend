const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const consultancies = new Schema(
	{
		client: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
			index: true,
		},
		therapist: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
			index: true,
		},
		visitsCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("consultancies", consultancies);
