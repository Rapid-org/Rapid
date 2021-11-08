module.exports = function(app) {
    const users = require('./controllers/userControllers');
    const projects = require('./controllers/projectControllers');
    const mailer = require('./controllers/mailControllers');
    const url = require('./controllers/urlControllers');
    app.route('/user')
        .post(users.create_a_user);
    app.get("/user/:uid", users.list_users_information);
    app.patch("/user/:uid", users.update_user);
    app.get('/projects/:id', projects.list_all_projects);
    app.post('/projects', projects.create_a_project);
    app.delete('/project/:id', projects.delete_project);
    app.patch('/project/:id', projects.update_project);
    app.get('/project/:id', projects.find_project);
    app.post('/mail/verification', mailer.send_verification_email);
    app.post('/shorten', url.shorten_url);
    app.get('/url/:code', url.redirect);
};