const mongoose = require("mongoose");


const connectMongoDB = () =>
{
    mongoose.connect(process.env.DATABASECONNECT)
    .then(() => 
    {
        console.log("mongo connected");
    })
    .catch('error', err => 
    {
        console.log("failed to connect to MongoDB: ", err);
    });
}

module.exports = connectMongoDB;
