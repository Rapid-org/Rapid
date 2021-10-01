module.exports = function(app) {
    const users = require('./controllers/userControllers');
    const projects = require('./controllers/projectControllers');
    app.route('/user')
        .post(users.create_a_user);
    app.get("/user/:uid", users.list_users_information);
    app.patch("/user/:uid", users.update_user);
    app.route('/projects')
        .post(projects.create_a_project)
        .get(projects.list_all_projects);
    app.delete('/project/:id', projects.delete_project);
    app.patch('/project/:id', projects.update_project);
};