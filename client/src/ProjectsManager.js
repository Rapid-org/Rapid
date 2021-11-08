import $ from 'jquery';

const API_SERVER_URL = "http://localhost:9980";
let projectsObj = null;

class ProjectsManager {
    constructor(user_, userToken) {
        this.user = user_;
        this.userToken = userToken;
    }

    fetchProjects(callback) {
        $.ajax({
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + this.userToken
            },
            url: API_SERVER_URL + "/projects/" + this.user._id,
            contentType: 'application/json',
            success: function (result, status, xhr) {
                if (xhr.status === 200) {
                    projectsObj = JSON.parse(xhr.responseText);
                    callback(xhr.status);
                } else {
                    callback(xhr.status);
                }
            },
            error: function (xhr) {
                callback(xhr.status);
            }
        });
    }

    loadProjectInformation(projectId, callback) {
        $.ajax({
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + this.userToken
            },
            url: API_SERVER_URL + "/project/" + projectId,
            contentType: 'application/json',
            success: function (result, status, xhr) {
                if (xhr.status === 200) {
                    const projectObj = JSON.parse(xhr.responseText);
                    callback(xhr.status, projectObj);
                } else {
                    callback(xhr.status, null);
                }
            },
            error: function (xhr) {
                callback(xhr.status);
            }
        });
    }

    getProjects() {
        return projectsObj;
    }

    newProject(projectInfo, callback) {
        const data = projectInfo;
        data.userId = this.user._id;
        $.ajax(API_SERVER_URL + "/projects", {
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + this.userToken
            },
            data: JSON.stringify(data),
            success: function (result, status, xhr) {
                projectsObj = JSON.parse(xhr.responseText);
                console.log(projectsObj);
                callback(xhr.status, projectsObj);
            },
            error: function (xhr) {
                console.log(xhr.responseText);
                callback(xhr.status, null);
            }
        });
    }

    deleteProject(project, callback) {
        console.log(project);
        $.ajax(API_SERVER_URL + "/project/" + project._id, {
            type: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + this.userToken
            },
            success: function (response, status, xhr) {
                console.log(response);
                callback(xhr.status);
            },
            error: function (xhr) {
                console.log(xhr);
                callback(xhr.status);
            }
        });
    }

    updateProject(project, callback) {
        if (project) {
            $.ajax(API_SERVER_URL + "/project/" + project._id, {
                type: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + this.userToken
                },
                contentType: 'application/json',
                data: JSON.stringify(project),
                success: function (result, status, xhr) {
                    console.log(result);
                    if (callback) {
                        callback(xhr.status);
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

export default ProjectsManager;