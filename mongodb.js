const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASECONNECT)

.then(() => 
{
    console.log("mongo connected");
})
.catch('error', err => 
{
    console.log("failed to connect to MongoDB: ", err);
});

const LoginSchema = new mongoose.Schema({
    createdDate: {
        type: Date,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type:String,
        required:true
    },
    password: {
        type:String,
        required:true
    },
    resetLink: {
        type: String,
        default: ''
    },
    likedVideos: {
        type: Array,
        default: ["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""]
    },
    _1_1: {
        type: Array,
        default: ["","","","","","","","","","","","","",""]
    },
    _1_2: {
        type: Array,
        default: ["","","","","","","","","","","","","","","","",""] 
    },
    _1_3: {
        type: Array,
        default: ["","","","","","","","","",""]
    },
    _1_4: {
        type: Array,
        default: ["","","",""]
    },
    _1_5: {
        type: Array,
        default: ["","","","","",""]
    },
    _1_6: {
        type: Array,
        default: ["","","",""]
    },
    _1_7: {
        type: Array,
        default: ["","","","","","","","","",""]
    },
    _1_8: {
        type: Array,
        default: ["","",""]
    },
    _1_9: {
        type: Array,
        default: ["","","","","","","","","","","","","","","","","","","","","",""]
    },
    _1_10: {
        type: Array,
        default: ["","","","","","","","","","","","","","","","","","","","","","","","",""]
    },
    _1_11: {
        type: Array,
        default: ["","","","","","","",""]
    },
    _1_12: {
        type: Array,
        default: ["","","","","","","","","","","","","","","","","","","",""]
    },
    _1_13: {
        type: Array,
        default: ["","","","","","","","","","",""]
    },
    _1_14: {
        type: Array,
        default: ["","","","","","","","","","","","","","","",""]
    },
    _1_15: {
        type: Array,
        default: ["","","","","",""]
    },
    _1_16: {
        type: Array,
        default: ["","","","","","",""]
    },
    _2_1: {
        type: Array,
        default: ["","","","","","","",""]
    },
    _2_2: {
        type: Array,
        default: ["","","","","","","","","",""]
    },
    _2_3: {
        type: Array,
        default: ["","","","",""]
    },
    _2_4: {
        type: Array,
        default: ["","","","","",""]
    },
    _2_5: {
        type: Array,
        default: ["","","",""]
    },
    _2_6: {
        type: Array,
        default: ["","","","","","",""]
    },
    _2_7: {
        type: Array,
        default: ["",""]
    },
    _2_8: {
        type: Array,
        default: ["",""]
    },
    _2_9: {
        type: Array,
        default: ["","","","","",""]
    },
    _2_10: {
        type: Array,
        default: ["","","","","","",""]
    },
    _2_11: {
        type: Array,
        default: ["","","",""]
    },
    _3_1: {
        type: Array,
        default: ["","","","","","","","",""]
    },
    _3_2: {
        type: Array,
        default: ["","","","",""]
    },
    _3_3: {
        type: Array,
        default: ["","","",""]
    },
    _3_4: {
        type: Array,
        default: ["","","","","","",""]
    },
    _3_5: {
        type: Array,
        default: ["","","",""]
    },
    _3_6: {
        type: Array,
        default: ["","","","",""]
    },
    _3_7: {
        type: Array,
        default: ["","","","",""]
    },
    _3_8: {
        type: Array,
        default: ["","","","","","",""]
    },
    _3_9: {
        type: Array,
        default: ["","","",""]
    },
    _3_10: {
        type: Array,
        default: ["","","","","","","","",""]
    }
    
}, {timestamps: true});

const loginCollection = mongoose.model("logincollections", LoginSchema);

module.exports = 
{
    loginCollection: loginCollection
}
