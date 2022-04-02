const mongoose = require('mongoose'),
    Users = mongoose.model('users');
const admin = require('firebase-admin');
exports.list_users_information = function (req, res) {
    const userId = req.params.uid;
    if (!userId) {
        res.status(400).send("User id parameter wasn't specified.");
        return;
    }
    Users.find({ uid: userId }, function (err, task) {
        if (err) {
            console.log(err);
            res.send({ "message": "User" + userId + " doesn't exist." });
            return;
        }
        if (!task) {
            console.log("Err!");
            res.send({ "message": "User" + userId + " doesn't exist." });
        } else {
            console.log(task);
            res.json(task);
        }
    });
};

exports.update_user = function (req, res) {
    const id = req.params.uid;
    console.log(req.body);
    console.log(id);
    Users.updateOne({ _id: id }, req.body, null, function (err, result) {
        if (err) {
            res.send(err);
            return;
        }
        console.log(result);
        res.send(JSON.stringify({ "message": "User successfully updated." }));
    });
};

exports.create_a_user = function (req, res) {
    admin.auth().createUser({
        email: req.body.email,
        displayName: req.body.name,
        photoURL: req.body.photoUrl,
        password: req.body.password
    }).then(user => {
        const data = req.body;
        data.uid = user.uid;
        delete data.password; // passwords aren't stored in the database
        const new_task = new Users(req.body);
        new_task.save(function (err, task) {
            if (err) {
                res.send(err);
            } else {
                res.json(task);
            }
        });
    }).catch((e) => {
        res.status(400).json({ error: e });
    });
};
