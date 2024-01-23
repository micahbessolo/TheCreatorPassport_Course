const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/LoginSignup")
.then(() => {
    console.log("mongo connected");
})
.catch(() => {
    console.log("failed to connect");
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
    videoState: {
        type:String,
        default: ''
    }
    
}, {timestamps: true})


const collection = mongoose.model("logincollections", LoginSchema);

module.exports = collection;