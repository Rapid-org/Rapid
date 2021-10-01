const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectsSchema = new Schema({
    name: {
        type: String,
        required: 'Please enter the nam for the project.'
    },
    userId: {
        type: String,
        required: 'Please enter the userID for the project.'
    },
    description: {
        type: String,
        required: false,
        default: ""
    },
    blocks: {
        type: String,
        required: false,
        default: ""
    },
    packageName: {
        type: String,
        required: 'Please enter the package name for the project.'
    },
    versionName: {
        type: String,
        required: false,
        default: "1.0"
    },
    versionNumber: {
        type: Number,
        required: false,
        default: 0
    },
    homeWebsite: {
        type: String,
        required: false,
        default: ""
    },
    minSdk: {
        type: String,
        required: false,
        default: ""
    },
    icon: {
        type: String,
        required: false,
        default: ""
    },
    incrementOnPublish: {
        type: Boolean,
        required: false,
        default: false
    },
    proguard: {
        type: Boolean,
        required: false,
        default: false
    },
    androidManifest: {
        type: String,
        required: false,
        default: "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\"\n" +
            "  package=\"com.example\"\n" +
            "  android:versionCode=\"1\"          \n" +
            "  android:versionName=\"1.0\" >\n" +
            "  <application>\n" +
            "    <!-- Define activities, services, and content providers here-->\n" +
            "  </application>\n" +
            "</manifest>"
    }
});

module.exports = mongoose.model('projects', projectsSchema);