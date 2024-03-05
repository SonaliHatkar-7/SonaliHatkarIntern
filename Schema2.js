// const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');
const studSchema = new mongoose.Schema({
    
    Roll_No: Number,
    First_Name : String,
    Middle_Name : String,
    Last_Name : String,
    Date_of_Birth : Date,
    Gender : String,
    Address: String,
    Contact_No: Number,
    Email : {
        type: String,
        unique: true
    },
    Password : String ,
    confirmPassword: {
        type : String,
        default: null
    },
    Role : String,
    lastLogin: {
        type : String,
        default : null
    },
    otp : {
        type : String,
        default : null
    },
    otptimeout:{
        type : String,
        default : null
    },

});

const studData = mongoose.model("studData", studSchema)
module.exports = studData;