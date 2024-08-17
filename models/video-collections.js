const mongoose = require("mongoose");

const videoCollectionSchema = new mongoose.Schema(
    {
        trackMod: {
            type: String,
            required: true
        },
        moduleName: {
            type: String,
            required: true
        },
        titles: {
            type:Array,
            required:true
        },
        links: {
            type:Array,
            required:true
        },
        copy: {
            type:Array,
            required:true
        },
        resources: {
            type:Array,
            required:true
        },
        time: {
            type:Array,
            required:true
        }
    });

const videoCollections = mongoose.model("video-collections", videoCollectionSchema);

module.exports = videoCollections;
