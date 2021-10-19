const mongoose = require('mongoose'),
    Projects = mongoose.model('projects');
Users = mongoose.model('users');
const admin = require('firebase-admin');

exports.list_all_projects = function (req, res) {
    const userId = req.params.id;
    if (!userId) {
        res.status(400).send("No user ID was provided");
        return;
    }
    let token = parseIdToken(req.headers);
    if (!token) {
        res.status(403).json({error: "No Credentials Sent!"});
        return;
    }
    getUserUid(token, function (uid, error) {
        if (uid) {
            getUserByUid(uid, (user) => {
                if (user && (userId === user._id.toString())) {
                    Projects.find({"userId": userId}, function (err, task) {
                        if (err)
                            res.send(err);
                        res.json(task);
                    });
                } else {
                    res.status(403).json({error: "You don't have access to this user."});
                }
            });
        } else if (error.errorInfo.code === 'auth/id-token-expired') {
            res.status(401).json({error: 'The ID token has expired!'});
        } else {
            res.status(403).json({error: "Invalid id token!"});
        }
    });
};

exports.create_a_project = function (req, res) {
    let token = parseIdToken(req.headers);
    if (!token) {
        res.status(403).json({error: "No Credentials Sent!"});
        return;
    }
    getUserUid(token, function (uid, error) {
        if (uid) {
            getUserByUid(uid, (user) => {
                if (user) {
                    Projects.findOne({name: req.body.name, userId: user._id.toString()}, (err, task) => {
                        if (task) {
                            res.status(409).send("A project with the same name already exists.");
                        } else {
                            const new_task = new Projects(req.body);
                                new_task.save().then((task, err) => {
                                    if (err)
                                        res.send(err);
                                    res.json(task);
                                }).catch((e) => {
                                    res.json({"error": `Failed to create new project. Error Stack:\n${e}`});
                                });
                        }
                    });
                } else {
                    res.status(403).json({error: "You don't have access to this project."});
                }
            });
        } else if (error.errorInfo.code === 'auth/id-token-expired') {
            res.status(401).json({error: 'The ID token has expired!'});
        } else {
            res.status(403).json({error: "Invalid id token!"});
        }
    });
};

exports.delete_project = function (req, res) {
    let token = parseIdToken(req.headers);
    if (!token) {
        res.status(403).json({error: "No Credentials Sent!"});
        return;
    }
    getUserUid(token, function (uid, error) {
        if (uid) {
            getUserByUid(uid, function (user) {
                if (user) {
                    getProjectByUser(user, function (project) {
                        if (project) {
                            const id = req.params.id;
                            Projects.deleteOne({_id: id}).then(function () {
                                res.json({"message": "Project successfully deleted."});
                            }).catch(function (err) {
                                res.json({"error": err});
                            });
                        } else {
                            res.status(403).json({error: "You don't have access to this project."});
                        }
                    });
                } else {
                    res.status(403).json({error: "No user was found with the given ID token."});
                }
            });
        } else if (error.errorInfo.code === 'auth/id-token-expired') {
            res.status(401).json({error: 'The ID token has expired!'});
        } else {
            res.status(403).json({error: 'Invalid Id token.'});
        }
    });
};

function parseIdToken(headers) {
    let token = headers.authorization;
    if (!token) {
        return null;
    }
    return token.replace('Bearer ', '');
}

function getUserUid(token, callback) {
    admin.auth()
        .verifyIdToken(token)
        .then((decodedToken) => {
            console.log(decodedToken);
            const uid = decodedToken.uid;
            callback(uid, null);
        }).catch((error) => {
        console.log(error);
        callback(null, error);
    });
}

function getUserByUid(uid, callback) {
    Users.findOne({uid: uid}).then(function (task) {
        if (task) {
            callback(task);
        } else {
            callback(null);
        }
    });
}

function getProjectByUser(user, callback) {
    Projects.findOne({userId: user._id.toString()}).then(function (task) {
        callback(task);
    });
}

exports.update_project = function (req, res) {
    const id = req.params.id;
    const name = req.body.name;
    let token = parseIdToken(req.headers);
    if (!token) {
        res.status(403).json({error: "No Credentials Sent!"});
        return;
    }
    console.log(token);
    getUserUid(token, function (uid, error) {
        console.log(uid);
        if (uid) {
            getUserByUid(uid, function (user) {
                if (user) {
                    Projects.find({userId: user._id.toString()}, function (err, task) {
                        console.log(task);
                        if (task.length === 0) {
                            res.status(403).send({error: "You don't have access to this project."});
                        } else {
                            if (name) {
                                Projects.findOne({name: name, userId: user._id.toString()}).then((task) => {
                                    if (!task) {
                                        doUpdateProject({_id: id}, req.body, function (err) {
                                            if (err) {
                                                res.status(400).json(err);
                                                return;
                                            }
                                            res.send(JSON.stringify({"message": "Project successfully updated."}));
                                        });
                                    } else {
                                        if (task.length > 1) {
                                            res.status(409).json({error: "A project with the same name already exists."});
                                        } else {
                                            doUpdateProject({_id: id}, req.body, function (err) {
                                                if (err) {
                                                    res.status(400).json(err);
                                                    return;
                                                }
                                                res.send(JSON.stringify({"message": "Project successfully updated."}));
                                            });
                                        }
                                    }

                                });
                            } else {
                                doUpdateProject({_id: id}, req.body, function (err) {
                                    if (err) {
                                        res.status(400).json(err);
                                        return;
                                    }
                                    res.send(JSON.stringify({"message": "Project successfully updated."}));
                                });
                            }
                        }
                    });
                } else {
                    res.status(403).json({error: "No user was found with the given ID token."});
                }
            });
        } else if (error.errorInfo.code === 'auth/id-token-expired') {
            res.status(401).json({error: 'The ID token has expired!'});
        } else {
            res.status(403).json({error: "Invalid id token!"});
        }
    });
};

function doUpdateProject(filter, update, callback) {
    Projects.updateOne(filter, update, null, function (err) {
        callback(err);
    });
}