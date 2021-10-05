const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
    uid: {
        type: String,
        required: 'Please enter the UID for the user.'
    },
    name: {
        type: String,
        required: 'Please enter the name for the user.'
    },
    photoUrl: {
        type: String,
        default: "",
        required: false
    },
    githubToken: {
        type: String,
        default: "",
        required: false
    }
});

module.exports = mongoose.model('users', usersSchema);