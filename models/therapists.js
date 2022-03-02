const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const therapists = new Schema(
	{
		profile: {
			type: Schema.Types.ObjectId,
			ref: "profiles",
			required: true,
			index: true,
		},
		clientsCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("therapists", therapists);
