const mongoose = require("mongoose");

const postCollectionSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "logincollections",
			required: true,
		},
		text: {
			type: String,
		},
		img: {
			type: String,
		},
		pdfName: {
			type: String,
			default: "",
			required: true
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "logincollections",
			},
		],
		pin: {
			type: Boolean,
			default: false,
		},
		resource: {
			type: Boolean,
			default: false,
		},
		comments: [
			{
				text: {
					type: String,
					required: true,
				},
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "logincollections",
					required: true,
				},
				likes: [
					{
						type: mongoose.Schema.Types.ObjectId,
						ref: "logincollections",
					},
				],
				comments: [
					{
						text: {
							type: String,
							required: true,
						},
						user: {
							type: mongoose.Schema.Types.ObjectId,
							ref: "logincollections",
							required: true,
						},
						likes: [
							{
								type: mongoose.Schema.Types.ObjectId,
								ref: "logincollections",
							},
						],
						createdAt: {
							type: Date,
							default: Date.now,
							required: true,
						},
					},
				],
				createdAt: [
					{
						type: Date,
						default: Date.now,
						required: true,
					},
				]
			},
		],
	},
	{ timestamps: true }
);

const postCollections = mongoose.model("posts-2", postCollectionSchema);

module.exports = postCollections;