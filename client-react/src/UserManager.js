import $ from 'jquery';

let user = null;
let userObject = null;
const API_SERVER_URL = "http://localhost:9980";

class UserManager {
    constructor(user_) {
        user = user_;
    }

    resolveUserID(callback) {
        $.ajax({
            type: 'GET', url: API_SERVER_URL + "/user/" + user.uid,
            contentType: 'application/json',
            success: function (result, status, xhr) {
                console.log(result);
                userObject = JSON.parse(xhr.responseText)[0];
                callback.call();
            },
            error: function () {
                console.log("calling for error");
                callback.call();
            }
        });
    }

    getUserId() {
        return userObject ? userObject._id : null;
    }

    getUser() {
        return userObject;
    }
}

export default UserManager;