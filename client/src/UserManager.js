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
                console.log(xhr.status);
                if (xhr.status === 200) {
                    userObject = JSON.parse(xhr.responseText)[0];
                    console.log(xhr.status);
                    console.log("success");
                    callback(true);
                } else {
                    console.log("error");
                    callback(false);
                }
            },
            error: function () {
                console.log("calling for error");
                callback(false);
            }
        });
    }

    getUserId() {
        return userObject ? userObject._id : null;
    }

    getUser() {
        return userObject;
    }

    updateUser(newUser, callback) {
        if (newUser) {
            $.ajax(API_SERVER_URL + "/user/" + newUser._id, {
                type: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + this.userToken
                },
                data: newUser,
                success: (result, status, xhr) => {
                    console.log(result);
                    if (callback) {
                        this.resolveUserID(() => {
                            callback(xhr.status);
                        });
                    }
                },
                error: function (xhr) {
                    console.log(xhr);
                    if (callback) {
                        callback(xhr.status);
                    }
                }
            });
        }
    }
}

export default UserManager;