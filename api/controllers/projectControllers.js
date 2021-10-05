const mongoose = require('mongoose'),
    Projects = mongoose.model('projects');

exports.list_all_projects = function(req, res) {
    const userId = req.params.id;
    if (!userId) {
        res.status(400).send("No user ID was provided");
        return;
    }
    Projects.find({"userId": userId}, function(err, task) {
        if (err)
            res.send(err);
        res.json(task);
    });
};

exports.create_a_project = function(req, res) {
    Projects.findOne({name: req.body.name, userId: req.body.userId}, function (err, task) {
        if (task) {
            res.status(409).send("A project with the same name already exists.");
        } else {
            const new_task = new Projects(req.body);
            new_task.save(function(err, task) {
                if (err)
                    res.send(err);
                res.json(task);
            });
        }
    });
};

exports.delete_project = function(req, res) {
    const id = req.params.id;
    Projects.deleteOne({_id: id}).then(function () {
       res.send(JSON.stringify({"message": "Project successfully deleted."}));
    }).catch(function (err) {
      res.send(JSON.stringify({"errors": err}));
    });
};

exports.update_project = function(req, res) {
    const id = req.params.id;
    Projects.updateOne({_id: id}, req.body, null, function(err) {
        if (err) {
            res.send(err);
            return;
        }
       res.send(JSON.stringify({"message": "Project successfully updated."}));
    });
};