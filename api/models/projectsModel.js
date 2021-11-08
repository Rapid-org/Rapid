const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectsSchema = new Schema({
    name: {
        type: String,
        required: 'Please enter the name for the project.',
        validate: [isClassNameValid, 'Please enter a valid name for the project.']
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
        required: 'Please enter the package name for the project.',
        validate: [isPackageName, 'Please enter a valid package name for the project.']
    },
    versionName: {
        type: String,
        required: false,
        default: "1.0"
    },
    versionNumber: {
        type: Number,
        required: false,
        default: 1
    },
    homeWebsite: {
        type: String,
        required: false,
        default: "",
        validate: [isValidUrl, 'Please enter a valid home website url.']
    },
    minSdk: {
        type: Number,
        required: false,
        default: 7
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
    },
    classes: {
        type: Array,
        default: [],
        required: false
    }
});

function isPackageName(packageName) {
    return (/(^(?:[a-z_]+(?:\d*[a-zA-Z_]*)*)(?:\.[a-z_]+(?:\d*[a-zA-Z_]*)*)*$)/).test(packageName);
}


function isClassNameValid(className) {
    return (!(/^\d/).test(className) && (/^[A-Z][A-Za-z]*$/).test(className));
}

function isValidUrl(url) {
    return url.length === 0 || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
}

module.exports = mongoose.model('projects', projectsSchema);