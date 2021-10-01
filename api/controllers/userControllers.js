const mongoose = require('mongoose'),
    Users = mongoose.model('users');
exports.list_users_information = function (req, res) {
    const userId = req.params.uid;
    if (!userId) {
        res.status(400).send("User id parameter wasn't specified.");
        return;
    }
    Users.find({uid: userId}, function (err, task) {
        if (err) {
            res.send("The user doesn't exist.");
            return;
        }
        if (!task) {
            res.send({"message": "User" + userId + " doesn't exist."});
        } else {
            res.json(task);
        }
    });
};

exports.update_user = function (req, res) {
    const id = req.params.id;
    Users.updateOne({_id: id}, req.body, null, function (err, result) {
        if (err) {
            res.send(err);
            return;
        }
        res.send(JSON.stringify({"message": "User successfully updated."}));
    });
};

exports.create_a_user = function (req, res) {
    const new_task = new Users(req.body);
    new_task.save(function (err, task) {
        if (err)
            res.send(err);
        res.json(task);
    });
};
