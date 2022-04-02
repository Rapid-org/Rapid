import { saveAs } from 'file-saver';
import $ from 'jquery';
import BlocklyWorkspace from './BlocklyWorkspace';

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
            xhr: function () {// Seems like the only way to get access to the xhr object
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob'
                return xhr;
            },
            url: API_SERVER_URL + "/project/" + projectId,
            success: function (data) {
                //if (xhr.status === 200) {
                console.log(data);
                callback(200, data);
                //const projectObj = JSON.parse(xhr.responseText);
                //callback(xhr.status, projectObj);
                //} else {
                //  callback(xhr.status, null);
                //}
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

    /**
     * 
     * @param {Object} project 
     * @param {BlocklyWorkspace} blocklyWorkspace 
     * @param {Function} callback 
     */
    importProject(project, callback) {
        this.blocklyWorkspace = new BlocklyWorkspace(project, this.projectManager);
        this.blocklyWorkspace.createProjectFile(project, (data) => {
            let formdata = new FormData;
            formdata.append('projectFile', data);
            if (project) {
                $.ajax(API_SERVER_URL + "/projects/import/", {
                    type: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + this.userToken
                    },
                    processData: false,
                    contentType: false,
                    data: formdata,
                    success: (result, status, xhr) => {
                        console.log(result);
                        this.blocklyWorkspace.disposeBlocklyWorkspace();
                        this.blocklyWorkspace = null;
                        if (callback) {
                            callback(xhr.status, project);
                        }
                    },
                    error: (xhr) => {
                        console.log(xhr);
                        this.blocklyWorkspace.disposeBlocklyWorkspace();
                        this.blocklyWorkspace = null;
                        if (callback) {
                            callback(xhr.status, null);
                        }
                    }
                });
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

    /**
     * 
     * @param {Object} project 
     * @param {BlocklyWorkspace} blocklyWorkspace 
     * @param {Function} callback 
     */
    updateProject(project, blocklyWorkspace, callback) {
        blocklyWorkspace.createProjectFile(project, (data) => {
            let formdata = new FormData;
            formdata.append('projectName', project.name);
            formdata.append('projectId', project._id);
            formdata.append('projectFile', data);
            if (project) {
                $.ajax(API_SERVER_URL + "/project/" + project._id, {
                    type: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + this.userToken
                    },
                    processData: false,
                    contentType: false,
                    data: formdata,
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
        });
    }


    /**
     * 
     * @param {Object} project 
     * @param {BlocklyWorkspace} blocklyWorkspace 
     * @param {Function} callback 
     */
    uploadProjectFile(file, project, callback) {
        let formdata = new FormData;
        formdata.append('projectFile', file);
        if (project) {
            $.ajax(API_SERVER_URL + "/project/" + project._id + "/upload?name=" + file.name, {
                type: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.userToken
                },
                processData: false,
                contentType: false,
                data: formdata,
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