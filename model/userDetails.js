const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userDetailsSchema = new Schema({
    userPassword: {
        type: String,
        required: true,
        trim: true,
    },
    userEmail: {
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

var userDetail = mongoose.model('userDetails', userDetailsSchema);
module.exports = userDetail;