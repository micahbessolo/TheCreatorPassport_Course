const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		from: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		type: {
			type: String,
			required: true,
			enum: ["reply", "like", "like comment", "comment"],
		},
		read: {
			type: Boolean,
			default: false,
		},
		post: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "Post",
		},
		comment: {
			type: mongoose.Schema.Types.ObjectId,
			required: false,
			ref: "Comment",
		},
	},
	{ timestamps: true }
);

const Notification = mongoose.model("notification-collections", notificationSchema);

module.exports = Notification;