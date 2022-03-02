const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clients = new Schema(
	{
		profile: {
			type: Schema.Types.ObjectId,
			ref: "profiles",
			required: true,
			index: true,
		},
		therapistsCount: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("clients", clients);
