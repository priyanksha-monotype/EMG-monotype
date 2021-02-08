const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const userDetailsSchema = new Schema({
    password: {
        type: String,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique : true,
    },
    isVerified: {
        type: Boolean,
        required: false,
    },
    sendToEmailId: {
        type: String,
        required: false,
    },
    receivedFromEmailId: {
        type: String,
        required: false,
    },
});

userDetailsSchema.plugin(passportLocalMongoose);

var userDetail = mongoose.model('userDetails', userDetailsSchema);
module.exports = userDetail;