import $ from 'jquery';

const API_SERVER_URL = "http://localhost:9980";
let projectsObj = null;

class ProjectsManager {
    constructor(user_) {
        this.user = user_;
    }

    fetchProjects(callback) {
        $.ajax({
            type: 'GET',
            url: API_SERVER_URL + "/projects/" + this.user._id,
            contentType: 'application/json',
            success: function (result, status, xhr) {
                projectsObj = JSON.parse(xhr.responseText);
                callback.call();
            },
            error: function () {
                callback.call();
            }
        });
    }

    getProjects() {
        return projectsObj;
    }

    newProject(projectInfo, callback) {
        $.ajax(API_SERVER_URL + "/projects", {
            type: 'POST',
            contentType: 'application/json',
            dataType: 'application/json',
            data: JSON.stringify({
                name: projectInfo.name,
                packageName: projectInfo.packageName,
                description: projectInfo.description,
                userId: this.user._id,
            }),
            success: function (result, status, xhr) {
                projectsObj = JSON.parse(xhr.responseText);
                console.log(projectsObj);
                callback.call(xhr.status, xhr.status);
            },
            error: function (xhr) {
                callback.call(xhr.status, xhr.status);
            }
        });
    }

    deleteProject(project, callback) {
        console.log(project);
        $.ajax(API_SERVER_URL + "/project/" + project._id, {
            type: 'DELETE',
            success: function (response) {
                console.log(response);
                callback.call(true, true);
            },
            error: function (xhr) {
                console.log(xhr);
                callback.call(false, false);
            }
        })
    }
}

export default ProjectsManager;