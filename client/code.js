/**
 * @author Mohamed Tamer
 */

/**
 * Create a namespace for the application.
 */
const Code = {};

Code.BUILD_SERVER_URL = "http://localhost:8080";

Code.API_SERVER_URL = "http://localhost:9980";

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

let currentProjectId;
let userId;
let isServerBusy = false;
let projectsObj;
let currentProject;
let qrCode;
let importProjectDialog;
let projectBuildFailedDialog;
let fileSelected;
let githubAccessToken;

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function () {
    const codeTextArea = document.getElementById("code");
    const editor = CodeMirror.fromTextArea(codeTextArea, {
        mode: "xml",
        theme: 'idea',
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true,
        autoCloseTags: true,
        lineNumbers: true,
        foldGutter: true
    });
    document.querySelectorAll('.mdc-button').forEach(
        function (ele) {
            mdc.ripple.MDCRipple.attachTo(ele);
        });
    document.querySelectorAll('.mdc-checkbox').forEach(
        function (ele) {
            mdc.checkbox.MDCCheckbox.attachTo(ele);
        });
    const linearProgressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('.mdc-linear-progress'));
    linearProgressBar.determinate = false;
    const generalElem = document.getElementById("general");
    const publishingElem = document.getElementById("publishing");
    const androidManifestElem = document.getElementById("android-manifest");
    new mdc.tabBar.MDCTabBar(document.querySelector(".mdc-tab-bar")).listen("MDCTabBar:activated", function (a) {
        const index = a.detail.index;
        if (index === 0) {
            generalElem.style.display = 'block';
            publishingElem.style.display = 'none';
            androidManifestElem.style.display = 'none';
        } else if (index === 1) {
            generalElem.style.display = 'none';
            publishingElem.style.display = 'block';
            androidManifestElem.style.display = 'none';
        } else if (index === 2) {
            generalElem.style.display = 'none';
            publishingElem.style.display = 'none';
            androidManifestElem.style.display = 'block';
            editor.refresh();
        }
    });
    new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'));
    const newProjectDialog = new mdc.dialog.MDCDialog(document.querySelector('.new-project-dialog'));
    document.getElementById("createnewproject").addEventListener("click", function () {
        resetProjectDialog();
        newProjectDialog.open();
    });
    document.getElementById("noprojects-createnewproject").addEventListener("click", function () {
        resetProjectDialog();
        newProjectDialog.open();
    });
    document.querySelectorAll('.mdc-text-field').forEach(
        function (ele) {
            new mdc.textField.MDCTextField(ele);
        });
    const importProjectDialogElem = document.querySelector(".import-project-dialog");
    importProjectDialog = new mdc.dialog.MDCDialog(importProjectDialogElem);
    const importMenuElement = document.querySelector("#import-project");
    importMenuElement.addEventListener("click", function () {
        // reinitializes the dialog
        document.querySelector('.project-preview').classList.add('hidden');
        document.getElementById("import-button").disabled = true;
        importProjectDialog.open();
    });
    document.getElementById("import-project-btn").addEventListener("click", function () {
        document.querySelector('.project-preview').classList.add('hidden');
        document.getElementById("import-button").disabled = true;
        importProjectDialog.open();
    });
    const fileMenuElem = document.querySelector('.file-menu');
    const fileMenuButtonElem = document.getElementById("file-button");
    const fileMenu = new mdc.menu.MDCMenu(fileMenuElem);
    fileMenuButtonElem.addEventListener("click", function () {
        fileMenu.open = !fileMenu.open;
        fileMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        fileMenu.setAnchorElement(fileMenuButtonElem);
    });
    const toolsMenuElem = document.querySelector('.tools-menu');
    const toolsMenuButtonElem = document.getElementById("tools-button");
    const toolsMenu = new mdc.menu.MDCMenu(toolsMenuElem);
    toolsMenuButtonElem.addEventListener("click", function () {
        toolsMenu.open = !fileMenu.open;
        toolsMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        toolsMenu.setAnchorElement(toolsMenuButtonElem);
    });
    const publishToGithubMenuItem = document.getElementById("publish-github");
    publishToGithubMenuItem.addEventListener("click", function () {
        const publishToGithubDialogElem = document.querySelector(".publish-to-github-dialog");
        const publishToGithubDialog = new mdc.dialog.MDCDialog(publishToGithubDialogElem);
        publishToGithubDialog.open();
    });
    const publishButton = document.getElementById("publish-button");
    publishButton.addEventListener("click", function () {
        const provider = new firebase.auth.GithubAuthProvider();
        provider.addScope('repo');
        firebase
            .auth().currentUser
            .linkWithPopup(provider)
            .then((result) => {
                const credential = result.credential;

                // This gives you a GitHub Access Token. You can use it to access the GitHub API.
                const token = credential.accessToken;
                // ...
                console.log(token);
                let uid = '';
                const dataArray = firebase.auth().currentUser.providerData;
                for (let i = 0; i < dataArray.length; i++) {
                    if (dataArray[i].providerId === 'github.com') {
                        uid = dataArray[i].uid;
                    }
                }
                $.get("https://api.github.com/user/" + uid, function (data) {
                    console.log(data);
                    console.log(data['login']);
                });
                const xhr = new XMLHttpRequest();
                xhr.open("PATCH", Code.API_SERVER_URL + "/user/" + userId, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onreadystatechange = function () {
                    console.log(xhr.responseText);
                };
                xhr.send(JSON.stringify({githubToken: githubAccessToken}));
            }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // ...
            console.log(errorMessage);
            const repositoryUrlTextField = document.getElementById("repository-url-input");
            if (errorCode === 'auth/provider-already-linked') {
                const dataArray = firebase.auth().currentUser.providerData;
                for (let i = 0; i < dataArray.length; i++) {
                    if (dataArray[i].providerId === 'github.com') {
                        $.get("https://api.github.com/user/" + dataArray[i].uid, function (data) {
                            Code.createProjectFileForCurrentProject(function (content, name) {
                                getBase64(content).then(function (value) {
                                    console.log(value);
                                    const xhr = new XMLHttpRequest();
                                    xhr.open("PUT", 'https://api.github.com/repos/' + data['login'] + '/' + repositoryUrlTextField.value + '/contents/' + currentProject['name'] + '.abx', true);
                                    xhr.setRequestHeader('Content-Type', 'application/json');
                                    xhr.setRequestHeader('Authorization', 'token ' + githubAccessToken);
                                    xhr.send(JSON.stringify({
                                        message: "Upload Project File",
                                        content: value.split("data:application/zip;base64,")[1]
                                    }));
                                });
                            }, false);
                        });
                    }
                }
            }
        });
    });

    document.getElementById("file-upload-btn").addEventListener("change", function () {
        const file = this.files[0];
        document.getElementById("project-preview-name").innerHTML = file.name;
        document.querySelector('.project-preview').classList.remove('hidden');
        document.querySelector('.project-preview').style.display = 'flex';
        Code.doImport(file);
    });
    document.getElementById("asset-file-upload-btn").addEventListener("change", function () {
        const file = this.files[0];
        fileSelected = file;
        document.getElementById("project-asset-preview-name").innerHTML = file.name;
        document.querySelector('.project-asset-preview').classList.remove('hidden');
        document.querySelector('.project-asset-preview').style.display = 'flex';
        const importButton = document.getElementById("asset-import-button");
        importButton.removeAttribute("disabled");
    });
    // configure drag & drop to upload for importing projects
    $(document).ready(function () {
        var holder = document.getElementById('holder');
        var assetHolder = document.getElementById('asset-holder');
        holder.ondragover = function () {
            this.className = 'hover';
            return false;
        };
        holder.ondrop = function (e) {
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            if (!file.name.endsWith(".abx")) {
                holder.classList.remove('hover');
                holder.classList.add('holder_default');
                var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.error-snackbar'));
                snackbar.labelText = "This file isn't a project file. Project files are .abx files.";
                snackbar.open();
                return;
            }
            holder.classList.remove('hover');
            holder.classList.add('holder_default');
            document.querySelector('.project-preview').classList.remove('hidden');
            document.querySelector('.project-preview').style.display = 'flex';
            document.getElementById("project-preview-name").innerHTML = file.name;
            Code.doImport(file);
        };
        assetHolder.ondragover = function () {
            this.className = 'hover';
            return false;
        };
        assetHolder.ondrop = function (e) {
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            fileSelected = file;
            assetHolder.classList.remove('hover');
            assetHolder.classList.add('holder_default');
            document.querySelector('.project-asset-preview').classList.remove('hidden');
            document.querySelector('.project-asset-preview').style.display = 'flex';
            document.getElementById("project-asset-preview-name").innerHTML = file.name;
            console.log(file.name);
            const importButton = document.getElementById("asset-import-button");
            importButton.removeAttribute("disabled");
        };
    });
    var uploadIconElem = document.getElementById("upload-project-icon");
    uploadIconElem.addEventListener("click", function () {
        Code.openAssetsDialog();
    });
    const buildMenuElem = document.querySelector('.build-menu');
    const buildMenuButtonElem = document.getElementById("build-button");
    const buildMenu = new mdc.menu.MDCMenu(buildMenuElem);
    buildMenuButtonElem.addEventListener("click", function () {
        buildMenu.open = !buildMenu.open;
        buildMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        buildMenu.setAnchorElement(buildMenuButtonElem);
    });
    const userMenuElem = document.querySelector('.user-menu');
    const userimage = document.getElementById("userimage");
    const userMenu = new mdc.menu.MDCMenu(userMenuElem);
    userimage.addEventListener("click", function () {
        console.log("Test");
        console.log(userMenu.open);
        userMenu.open = !userMenu.open;
        userMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        userMenu.setAnchorElement(userimage);
    });

    const buildDebugProject = document.getElementById("build-debug-project");
    buildDebugProject.addEventListener("click", function () {
        Code.buildProject(true);
    });
    const buildPublishProject = document.getElementById("build-publish-project");
    buildPublishProject.addEventListener("click", function () {
        Code.buildProject(false);
    });
    const signOut = document.getElementById("sign-out");
    signOut.addEventListener("click", function () {
        firebase.auth().signOut();
    });
    const saveProject = document.getElementById("save-project");
    saveProject.addEventListener("click", function () {
        Code.saveProject();
        const snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.info-snackbar'));
        snackbar.labelText = "Project Saved.";
        snackbar.open();
    });
    const deleteProjectDialogElem = document.querySelector(".delete-project-dialog");
    const deleteProjectDialog = new mdc.dialog.MDCDialog(deleteProjectDialogElem);
    const deleteProject = document.getElementById("delete-project");
    const deleteProjectDialogTitle = document.getElementById("delete-project-dialog-title");
    const deleteProjectDialogContent = document.getElementById("delete-dialog-content");
    deleteProject.addEventListener("click", function () {
        deleteProjectDialogTitle.innerHTML = 'Are you sure you want to delete "' + currentProject['name'] + '"?';
        deleteProjectDialogContent.innerHTML = 'You are about to delete "' + currentProject['name'] + '", after deleting it, <b>There will be absolutely no way to resotre it back!</b> Make sure to take a backup in case you want to use it back again.';
        deleteProjectDialog.open();
        document.getElementById("delete-project-btn").addEventListener("click", function () {
            Code.deleteCurrentProject();
        });
    });
    const projectBuildFailedDialogElem = document.querySelector(".build-failed-dialog");
    projectBuildFailedDialog = new mdc.dialog.MDCDialog(projectBuildFailedDialogElem);
    const exportProject = document.getElementById("export-project");
    exportProject.addEventListener("click", function () {
        Code.createProjectFileForCurrentProject(function (content) {
            saveAs(content, currentProject['name'] + ".abx");
        }, false);
    });
    const newProjectMenuitem = document.getElementById("new-project");
    newProjectMenuitem.addEventListener("click", function () {
        resetProjectDialog();
        newProjectDialog.open();
    });
    const myProjectsMenuitem = document.getElementById("my-projects");
    myProjectsMenuitem.addEventListener("click", function () {
        Code.loadProjects();
        Code.unloadCurrentProject();
    });
    var firebaseConfig = {
        apiKey: "AIzaSyCPEQpKKzAxKREl7enSSSSWTc5UG3DftBc",
        authDomain: "aixbuilder.firebaseapp.com",
        projectId: "aixbuilder",
        storageBucket: "aixbuilder.appspot.com",
        messagingSenderId: "964934130307",
        appId: "1:964934130307:web:73fcb8e2382f76cb4659b6",
        measurementId: "G-8Q89DSMK8F"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            document.getElementById("userimage").src = user.photoURL;
            Code.resolveUserID();
        } else {
            window.location.href = "../auth/index.html";
        }
    });
    const projectNameInput = document.getElementById("newprojectdialog-name-input");
    const projectDescriptionInput = document.getElementById("newprojectdialog-description-input");
    const packageNameInput = document.getElementById("newprojectdialog-packagename-input");
    const createProjectButton = document.getElementById("create-button");
    projectNameInput.addEventListener("input", function () {
        validateInputs();
    });
    packageNameInput.addEventListener("input", function () {
        validateInputs();
    });

    function validateInputs() {
        console.log(isProjectnameInputInvalid());
        if (isProjectnameInputInvalid() || isPackageNameInputInvalid()) {
            createProjectButton.setAttribute("disabled", "disabled");
        } else {
            createProjectButton.removeAttribute("disabled");
        }
    }

    function isProjectnameInputInvalid() {
        console.log(/[A-Za-z_$]+[a-zA-Z0-9_$]*/.test(projectNameInput.value));
        return !/[A-Za-z_$]+[a-zA-Z0-9_$]*/.test(projectNameInput.value) || projectNameInput.value.length === 0 || '0123456789'.indexOf(projectNameInput.value[0]) != -1;
    }

    function isPackageNameInputInvalid() {
        return !/(?!^abstract$|^abstract\..*|.*\.abstract\..*|.*\.abstract$|^assert$|^assert\..*|.*\.assert\..*|.*\.assert$|^boolean$|^boolean\..*|.*\.boolean\..*|.*\.boolean$|^break$|^break\..*|.*\.break\..*|.*\.break$|^byte$|^byte\..*|.*\.byte\..*|.*\.byte$|^case$|^case\..*|.*\.case\..*|.*\.case$|^catch$|^catch\..*|.*\.catch\..*|.*\.catch$|^char$|^char\..*|.*\.char\..*|.*\.char$|^class$|^class\..*|.*\.class\..*|.*\.class$|^const$|^const\..*|.*\.const\..*|.*\.const$|^continue$|^continue\..*|.*\.continue\..*|.*\.continue$|^default$|^default\..*|.*\.default\..*|.*\.default$|^do$|^do\..*|.*\.do\..*|.*\.do$|^double$|^double\..*|.*\.double\..*|.*\.double$|^else$|^else\..*|.*\.else\..*|.*\.else$|^enum$|^enum\..*|.*\.enum\..*|.*\.enum$|^extends$|^extends\..*|.*\.extends\..*|.*\.extends$|^final$|^final\..*|.*\.final\..*|.*\.final$|^finally$|^finally\..*|.*\.finally\..*|.*\.finally$|^float$|^float\..*|.*\.float\..*|.*\.float$|^for$|^for\..*|.*\.for\..*|.*\.for$|^goto$|^goto\..*|.*\.goto\..*|.*\.goto$|^if$|^if\..*|.*\.if\..*|.*\.if$|^implements$|^implements\..*|.*\.implements\..*|.*\.implements$|^import$|^import\..*|.*\.import\..*|.*\.import$|^instanceof$|^instanceof\..*|.*\.instanceof\..*|.*\.instanceof$|^int$|^int\..*|.*\.int\..*|.*\.int$|^interface$|^interface\..*|.*\.interface\..*|.*\.interface$|^long$|^long\..*|.*\.long\..*|.*\.long$|^native$|^native\..*|.*\.native\..*|.*\.native$|^new$|^new\..*|.*\.new\..*|.*\.new$|^package$|^package\..*|.*\.package\..*|.*\.package$|^private$|^private\..*|.*\.private\..*|.*\.private$|^protected$|^protected\..*|.*\.protected\..*|.*\.protected$|^public$|^public\..*|.*\.public\..*|.*\.public$|^return$|^return\..*|.*\.return\..*|.*\.return$|^short$|^short\..*|.*\.short\..*|.*\.short$|^static$|^static\..*|.*\.static\..*|.*\.static$|^strictfp$|^strictfp\..*|.*\.strictfp\..*|.*\.strictfp$|^super$|^super\..*|.*\.super\..*|.*\.super$|^switch$|^switch\..*|.*\.switch\..*|.*\.switch$|^synchronized$|^synchronized\..*|.*\.synchronized\..*|.*\.synchronized$|^this$|^this\..*|.*\.this\..*|.*\.this$|^throw$|^throw\..*|.*\.throw\..*|.*\.throw$|^throws$|^throws\..*|.*\.throws\..*|.*\.throws$|^transient$|^transient\..*|.*\.transient\..*|.*\.transient$|^try$|^try\..*|.*\.try\..*|.*\.try$|^void$|^void\..*|.*\.void\..*|.*\.void$|^volatile$|^volatile\..*|.*\.volatile\..*|.*\.volatile$|^while$|^while\..*|.*\.while\..*|.*\.while$)(^(?:[a-z_]+(?:\d*[a-zA-Z_]*)*)(?:\.[a-z_]+(?:\d*[a-zA-Z_]*)*)*$)/.test(packageNameInput.value) || packageNameInput.value.length == 0;
    }

    function resetProjectDialog() {
        projectNameInput.value = '';
        projectDescriptionInput.value = '';
        packageNameInput.value = '';
    }

    createProjectButton.addEventListener("click", function () {
        Code.createNewProject(projectNameInput.value, projectDescriptionInput.value, packageNameInput.value);
    });
    const projectOptionsMenuItem = document.getElementById("project-options");
    projectOptionsMenuItem.addEventListener("click", function () {
        const projectOptionsDialogEnum = document.querySelector(".project-options-dialog");
        const projectOptionsDialog = new mdc.dialog.MDCDialog(projectOptionsDialogEnum);
        document.getElementById("close-options-dialog-icon").addEventListener("click", function () {
            projectOptionsDialog.close();
        });
        projectOptionsDialog.open();
        const projectNameInput = document.getElementById("project-name-field");
        projectNameInput.value = currentProject['name'];
        const projectPackageNameInput = document.getElementById("project-package-name-field");
        projectPackageNameInput.value = currentProject['packageName'];
        const projectDescriptionInput = document.getElementById("project-description-field");
        projectDescriptionInput.value = currentProject['description'];
        const projectVersionNameInput = document.getElementById("project-version-name-field");
        projectVersionNameInput.value = currentProject['versionName'];
        const projectVersionNumberInput = document.getElementById("project-version-number-field");
        projectVersionNumberInput.value = currentProject['versionNumber'];
        const projectHomeWebsiteInput = document.getElementById("project-home-website-field");
        projectHomeWebsiteInput.value = currentProject['homeWebsite'];
        const projectMinSdkInput = document.getElementById("project-min-sdk-select");
        const projectIconInput = document.getElementById("project-icon-field");
        projectIconInput.value = currentProject['icon'].split(":icon:")[1];
        const select = new mdc.select.MDCSelect(projectMinSdkInput);
        select.value = currentProject['minSdk'];
        const projectIconHiddenField = document.getElementById("project-icon-hidden-field");
        projectIconHiddenField.value = currentProject['icon'].split(":icon:")[0];
        const autoIncrementOnPublishCheckbox = document.getElementById("incrementonpublish-checkbox");
        autoIncrementOnPublishCheckbox.checked = (currentProject['incrementOnPublish'] === 'true');
        const proguardCheckbox = document.getElementById("proguard-checkbox");
        proguardCheckbox.checked = (currentProject['proguard'] == 'true');
        editor.setValue(unescape(currentProject['androidManifest']));
        projectIconInput.focus();
        projectMinSdkInput.click();
        projectPackageNameInput.focus();
        projectVersionNameInput.focus();
        projectVersionNumberInput.focus();
        projectHomeWebsiteInput.focus();
        projectDescriptionInput.focus();
        projectNameInput.focus();
        const saveButtonElem = document.getElementById("settings-dialog-save-button");
        saveButtonElem.addEventListener("click", function () {
            const keys = [];
            const values = [];
            if (projectNameInput.value !== currentProject['name']) {
                keys.push('name');
                values.push(projectNameInput.value);
            }
            if (projectDescriptionInput.value !== currentProject['description']) {
                keys.push('description');
                values.push(projectDescriptionInput.value);
            }
            if (projectPackageNameInput.value !== currentProject['packageName']) {
                keys.push('packageName');
                values.push(projectPackageNameInput.value);
            }
            if (projectVersionNameInput.value !== currentProject['versionName']) {
                keys.push('versionName');
                values.push(projectVersionNameInput.value);
            }
            if (projectVersionNumberInput.value !== currentProject['versionNumber']) {
                keys.push('versionNumber');
                values.push(projectVersionNumberInput.value);
            }
            if (projectHomeWebsiteInput.value !== currentProject['homeWebsite']) {
                keys.push('homeWebsite');
                values.push(projectHomeWebsiteInput.value);
            }
            if (select.value !== currentProject['minSdk']) {
                keys.push('minSdk');
                values.push(select.value);
            }
            if (projectIconHiddenField.value + ":icon:" + projectIconInput.value !== currentProject['icon']) {
                keys.push('icon');
                console.log(projectIconHiddenField.value);
                console.log(projectIconInput.value);
                values.push(projectIconHiddenField.value + ":icon:" + projectIconInput.value);
            }
            if (autoIncrementOnPublishCheckbox.checked !== (currentProject['incrementOnPublish'] === "true")) {
                keys.push('incrementOnPublish');
                values.push(autoIncrementOnPublishCheckbox.checked ? "true" : "false");
            }
            if (proguardCheckbox.checked !== (currentProject['proguard'] === "true")) {
                keys.push('proguard');
                values.push(proguardCheckbox.checked ? "true" : "false");
            }
            console.log(editor.getValue());
            if (editor.getValue() !== currentProject['androidManifest']) {
                keys.push('androidManifest');
                values.push(mysql_real_escape_string(unescape(editor.getValue())));
            }
            console.log(keys);
            if (keys.length) {
                Code.updateCurrentProject(values, keys, function () {
                    if (this) {
                        projectOptionsDialog.close();
                        showProjectSettingsUpdated();
                    }
                    projectOptionsDialog.close();
                });
            } else {
                projectOptionsDialog.close();
            }
        });
    });
};


function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        const begin = sliceIndex * sliceSize;
        const end = Math.min(begin + sliceSize, bytesLength);

        const bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, {type: contentType});
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
}

Code.openAssetsDialog = function () {
    var importAssetProjectDialogElem = document.querySelector(".import-asset-dialog");
    var importAssetProjectDialog = new mdc.dialog.MDCDialog(importAssetProjectDialogElem);
    importAssetProjectDialog.open();
    var importButton = document.getElementById("asset-import-button");
    var projectIconTextField = document.getElementById("project-icon-field");
    var projectIconhiddenField = document.getElementById("project-icon-hidden-field");
    importButton.addEventListener("click", function () {
        getBase64(fileSelected).then(function (content) {
            projectIconTextField.focus();
            projectIconhiddenField.value = content;
            projectIconTextField.value = fileSelected.name;
        });
    });
};

function showProjectSettingsUpdated() {
    var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.info-snackbar'));
    snackbar.labelText = "Project Settings Updated.";
    snackbar.open();
}

Code.updateCurrentProject = function (values, keys, callback) {
    if (isServerBusy) {
        return;
    }
    isServerBusy = true; // disallow requests when there is already a request being sent.
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", Code.API_SERVER_URL + "/project/" + currentProject['_id'], true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            isServerBusy = false;
            callback.call(xhr.status === 200);
            if (xhr.status === 200) {
                for (let i = 0; i < keys.length; i++) {
                    currentProject[keys[i]] = values[i];
                }
            } else if (xhr.status === 409) {
                // the 409 error status code is send from the servers when a project with the same name exists in this account.
                const snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));
                snackbar.labelText = "A project with the same name already exists!";
                snackbar.open();
            }
        }
    };
    let queryParameters = {};
    for (let i = 0; i < keys.length; i++) {
        queryParameters[keys[i]] = values[i];
    }
    console.log(queryParameters);
    xhr.send(JSON.stringify(queryParameters));
};

Code.buildProject = function (debug) {
    if (!debug && (currentProject['incrementOnPublish'] === 'true')) {
        console.log([currentProject['versionNumber']++], ['versionNumber']);
        Code.updateCurrentProject([currentProject['versionNumber']++], ['versionNumber'], function () {
            Code.buildProject_(debug);
        });
        return;
    }
    Code.buildProject_(debug);
};

function mysql_real_escape_string(str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char; // prepends a backslash to backslash, percent,
            // and double/single quotes
            default:
                return char;
        }
    });
}

Code.buildProject_ = function (debug) {
    const buildPopup = document.getElementById("projectbuilding-popup");
    const buildPopupLabel = document.getElementById("building-popup-label");
    buildPopupLabel.innerHTML = "Building " + currentProject['name'] + "..";
    buildPopup.style.visibility = "visible";
    Code.createProjectFileForCurrentProject(function (content) {
        var fd = new FormData();
        fd.append('input', content);
        $.ajax({
            type: 'POST',
            url: Code.BUILD_SERVER_URL + '/build',
            data: fd,
            timeout: 15000,
            processData: false,
            contentType: false
        }).done(function (data) {
            buildPopup.style.visibility = "hidden";
            const json = JSON.parse(data);
            const success = json['success'];
            console.log(data);
            if (success) {
                const qrCodeElem = document.getElementById('qrcode');
                if (qrCode !== undefined) {
                    qrCode.clear();
                    qrCodeElem.innerHTML = "";
                }
                qrCode = new QRCode(qrCodeElem, {
                    text: json['downloadUrl'],
                    width: 128,
                    height: 128,
                    colorDark: '#000',
                    colorLight: '#fff',
                    correctLevel: QRCode.CorrectLevel.H
                });
                const buildDialog = new mdc.dialog.MDCDialog(document.querySelector('.build-success-dialog'));
                buildDialog.open();
                const okButton = document.getElementById("build-dialog-ok-button");
                okButton.addEventListener("click", function () {
                    buildDialog.close();
                });
                const buildFailedOkButton = document.getElementById("build-failed-dialog-ok-button");
                buildFailedOkButton.addEventListener("click", function () {
                    projectBuildFailedDialog.close();
                });
                var downloadExtensionButton = document.getElementById("download-extension-button");
                downloadExtensionButton.href = JSON.parse(data)['downloadUrl'];
            } else {
                var logs = document.getElementById("logs");
                logs.innerHTML = json["messages"].replaceAll("\n", "<br>");
                logs.innerHTML += json["errors"].replaceAll("\n", "<br>");
                projectBuildFailedDialog.open();
            }
        }).fail(function () {
            buildPopup.style.visibility = "hidden";
            var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.error-snackbar'));
            snackbar.labelText = "The buildserver is temporarily unavailable.";
            console.log(snackbar);
            snackbar.open();
        });
    }, !debug);
}

Code.doImport = function (file) {
    let reader = new FileReader();
    let name;
    let packageName;
    let description;
    let zipFile;
    const importButton = document.getElementById("import-button");
    reader.onload = function (e) {
        JSZip.loadAsync(e.target.result)
            .then(function (zip) {
                zipFile = zip;
                return zip.file("extension.json").async("string");
            }).then(function (extensionJson) {
            const json = JSON.parse(extensionJson);
            console.log(json);
            document.getElementById("project-preview-description").innerHTML = json['description'] ? json['description'] : "";
            name = json['name'];
            description = json['description'] ? json['description'] : "";
            packageName = json['packageName'];
            return zipFile.file("src/main/blocks/" + name + ".xml").async("string");
        }).then(function (blocksMapping) {
            importButton.removeAttribute("disabled");
            importButton.addEventListener("click", function (e) {
                e.stopImmediatePropagation();
                importProjectDialog.close();
                Code.createNewProject(name, description, packageName, blocksMapping);
            });
        });
    };
    reader.readAsArrayBuffer(file);
};

Code.deleteProject = function (id) {
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", Code.API_SERVER_URL + "/project/" + id, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (Blockly.mainWorkspace !== undefined) {
                Code.unloadCurrentProject(); // don't show a deleted project
            }
            document.getElementById("loadingProject").style.display = "table-cell";
            Code.loadProjects(); // reload projects for the project deletion to take place.
        }
    };
    xhr.send("key=aixbuildr@@584390&" +
        "id=" + id);
};

Code.deleteCurrentProject = function () {
    Code.deleteProject(currentProjectId);
};

Code.createProjectFileForCurrentProject = function (callback, release) {
    Code.createProjectFile(currentProject, callback, release);
};

Code.createProjectFile = function (project, callback, release) {
    const zip = new JSZip();
    const sourceDirectory = "src/main/java/" + project['packageName'].replaceAll(".", "/");
    const blocksDirectory = "src/main/blocks";
    // holds the extension information, parsed in the buildserver or when importing a project
    const extensionJson = {
        "name": project['name'],
        "packageName": project['packageName'],
        "proguard": release ? project['proguard'] : "false",
        "icon": 'aiwebres/' + project['icon'].split(":icon:")[1]
    };
    zip.file("extension.json", JSON.stringify(extensionJson));
    zip.file("AndroidManifest.xml", decodeURIComponent(project['androidManifest']));
    zip.folder(sourceDirectory);
    zip.folder(blocksDirectory);
    Code.workspace.options.appTitle = project['name'];
    Blockly.Java.setPackage(project['packageName']);
    Blockly.Java.setDescription(project["description"]);
    Blockly.Java.setVersionName(project["versionName"]);
    Blockly.Java.setVersionNumber(project["versionNumber"]);
    Blockly.Java.setHomeWebsite(project["homeWebsite"]);
    Blockly.Java.setMinSdk(project['minSdk']);
    console.log("Base 64 string: " + project['icon'].split(":icon:")[0]);
    var iconBlob = base64toBlob(project['icon'].split(":icon:")[0]);
    zip.file('aiwebres/' + project['icon'].split(":icon:")[1], iconBlob);
    Blockly.Java.setIcon('aiwebres/' + project['icon'].split(":icon:")[1]);
    Blockly.Java.setName(firebase.auth().currentUser.displayName);
    var code = Blockly.Java.workspaceToCode(Code.workspace);
    zip.file(sourceDirectory + "/" + project['name'] + ".java", code);
    var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    zip.file(blocksDirectory + "/" + project['name'] + ".xml", xmlText);
    zip.generateAsync({type: "blob"}).then(function (content) {
        callback(content, project['name']);
    });
};

Code.uploadAsset = function (key, callback) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData();
    let photo = fileSelected;

    formData.append("fileToUpload", photo);
    formData.append("userId", userId);
    formData.append("projectId", currentProjectId);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                currentProject[key] = xhr.responseText;
                callback.call(xhr.responseText);
                fileSelected = undefined;
            }
        }
    };
    xhr.timeout = 5000;
    xhr.open("POST", 'https://aixbuilder.000webhostapp.com/uploadAsset.php');
    xhr.send(formData);
};

Code.createNewProject = function (projectName, projectDescription, packageName, blocks_opt) {
    const blocks = blocks_opt || "";
    const xhr = new XMLHttpRequest();
    xhr.open("POST", Code.API_SERVER_URL + "/projects", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                const projectObj = JSON.parse(xhr.responseText);
                console.log(projectObj);
                Code.loadProjects();
                if (blocks.length !== 0) {
                    projectObj['blocks'] = blocks_opt;
                }
                Code.loadProject(projectObj);
            } else if (xhr.status === 409) {
                // the 409 error status code is send from the servers when a project with the same name exists in this account.
                var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));
                snackbar.labelText = "A project with the same name already exists!";
                snackbar.open();
            }
        }
    };
    xhr.send(JSON.stringify({
        name: projectName,
        description: projectDescription,
        packageName: packageName,
        userId: userId
    }));
};

Code.saveProject = function () {
    isServerBusy = true; // disallow requests when there is already a request being sent.
    const xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", Code.API_SERVER_URL + "/project/" + currentProjectId, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            isServerBusy = false;
        }
    };
    xhr.send(JSON.stringify({blocks: xmlText}));
};

Code.unloadCurrentProject = function () {
    currentProjectId = undefined;
    currentProject = undefined;
    if (Blockly.mainWorkspace) {
        Blockly.mainWorkspace.dispose();
    }
    const blocklyDiv = document.getElementById("blocklyDiv");
    if (blocklyDiv) {
        blocklyDiv.remove();
    }
    const blocklyToolboxDiv = document.querySelector(".blocklyToolboxDiv");
    if (blocklyToolboxDiv) {
        blocklyToolboxDiv.remove();
    }
    const projectsView = document.getElementById('projectsView');
    const selectedProjectsControls = document.getElementById('selectedProjectControlls');
    const projectControls = document.getElementById('projectsControlls');
    if (selectedProjectsControls.style.display !== 'none') {
        projectControls.style.display = 'block';
    } else {
        selectedProjectsControls.style.display = 'none';
        projectControls.style.display = 'block';
    }
    projectsView.style.display = 'table';
    const projectToolbar = document.getElementById("project-toolbar");
    projectToolbar.style.visibility = "hidden";
};

Code.loadProject = function (projectObj) {
    Code.loadProject(projectObj, false);
};

Code.loadProject = function (projectObj, loadInBackground) {
    if (currentProject) {
        this.unloadCurrentProject();
    }
    currentProjectId = projectObj['_id'];
    currentProject = projectObj;
    const blocklyDiv = document.createElement('div');
    blocklyDiv.id = 'blocklyDiv';
    if (!loadInBackground) {
        blocklyDiv.style = 'position: absolute; height: 84vh; width: 100%;';
    } else {
        blocklyDiv.style = 'display: none';
    }
    document.body.appendChild(blocklyDiv);
    Code.workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
            pinch: true
        },
        trashcan: true
    });
    if ((projectObj['blocks'] != null && projectObj['blocks'].length !== 0)) {
        const xml = Blockly.Xml.textToDom(decodeURIComponent(projectObj['blocks']).replaceAll('+', ' '));
        console.log(Code.workspace);
        Blockly.Xml.domToWorkspace(Code.workspace, xml);
    }
    if (!loadInBackground) {
        const projectsView = document.getElementById('projectsView');
        const projectsControls = document.getElementById('projectsControlls');
        const noProjects = document.getElementById("noprojects");
        projectsView.style.display = 'none';
        projectsControls.style.display = 'none';
        noProjects.style.display = 'none';
        const projectToolbar = document.getElementById("project-toolbar");
        projectToolbar.style.visibility = "visible";
        Code.workspace.addChangeListener(function () {
            if (!isServerBusy) {
                Code.saveProject();
            }
        });
    }
};

Code.getProjectByID = function (id) {
    for (let i = 0; i < projectsObj.length; i++) {
        if (projectsObj[i]._id === id) {
            return projectsObj[i];
        }
    }
    return undefined;
};

Code.loadProjects = function () {
    $.ajax({
        type: 'GET',
        url: Code.API_SERVER_URL + "/projects?userId=" + userId,
        contentType: 'application/json',
        success: function (result, status, xhr) {
            projectsObj = JSON.parse(xhr.responseText);
            const loadingProjectsElem = document.getElementById("loadingProject");
            loadingProjectsElem.style.display = "none";
            if (projectsObj.length === 0) {
                const noProjectsElem = document.getElementById("noprojects");
                noProjectsElem.style.display = "table-row";
                const projects = document.getElementById('projects');
                projects.style.display = 'none';
            } else {
                const projectsElem = document.getElementById("projects");
                projectsElem.style.display = "table-row";
                const projectsList = document.getElementById("projectsList");
                projectsList.innerHTML = "";
                for (let i = 0; i < projectsObj.length; i++) {
                    projectsList.innerHTML += `<li class="mdc-list-item project-list-item" id=` + "project-" + projectsObj[i]['_id'] + ` style="border-radius: 6px;margin-right: 10px;">
              <span class="mdc-list-item__ripple"></span>` +
                        `<span class="mdc-list-item__graphic">
              <div class="mdc-checkbox" style="margin-top: -6px;
              margin-left: -9px;--mdc-theme-secondary: var(--mdc-theme-primary);">
                <input type="checkbox"
                        class="mdc-checkbox__native-control"
                        id="` + "project-checkbox-" + projectsObj[i]['_id'] + `"/>
                <div class="mdc-checkbox__background">
                  <svg class="mdc-checkbox__checkmark"
                        viewBox="0 0 24 24">
                    <path class="mdc-checkbox__checkmark-path"
                          fill="none"
                          d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                  </svg>
                  <div class="mdc-checkbox__mixedmark"></div>
                </div>
              </div>
            </span>` +
                        `<span class="mdc-list-item__text">
                <span class="mdc-list-item__primary-text">` + projectsObj[i]['name'] + `</span>
                <span class="mdc-list-item__secondary-text">` + projectsObj[i]['description'] + `</span>
              </span>
            </li>`;

                    document.querySelectorAll(".mdc-list-item").forEach((elem) => {
                        mdc.ripple.MDCRipple.attachTo(elem);
                    });
                    const checkedProjects = [];
                    document.addEventListener("click", (event) => {
                        if (event.target.id.startsWith("project-checkbox-")) {
                            const id = event.target.id.replaceAll("project-checkbox-", "");
                            if (event.target.checked) {
                                if (!checkedProjects.includes(id)) {
                                    checkedProjects.push(id);
                                }
                            } else {
                                if (checkedProjects.includes(id)) {
                                    checkedProjects.splice(checkedProjects.indexOf(id), 1);
                                }
                            }

                            const projectsControls = document.getElementById("projectsControlls");
                            const selectedProjectsControls = document.getElementById("selectedProjectControlls");
                            if (checkedProjects.length !== 0) {
                                projectsControls.style.display = 'none';
                                selectedProjectsControls.style.display = 'block';
                                document.getElementById("delete-selected-project-btn").addEventListener("click", function () {
                                    const deleteProjectDialogTitle = document.getElementById("delete-project-dialog-title");
                                    const deleteProjectDialogContent = document.getElementById("delete-dialog-content");
                                    const deleteProjectDialogElem = document.querySelector(".delete-project-dialog");
                                    const deleteProjectDialog = new mdc.dialog.MDCDialog(deleteProjectDialogElem);
                                    let projects = '';
                                    for (let i = 0; i < checkedProjects.length; i++) {
                                        const project = Code.getProjectByID(checkedProjects[i]);
                                        if (projects.length !== 0) {
                                            projects += ', ' + project['name'];
                                        } else {
                                            projects += project['name'];
                                        }
                                    }
                                    deleteProjectDialogTitle.innerHTML = 'Are you sure you want to delete "' + projects + '"?';
                                    deleteProjectDialogContent.innerHTML = 'You are about to delete "' + projects + '", after deleting it, <b>There will be absolutely no way to resotre it back!</b> Make sure to take a backup in case you want to use it back again.';
                                    deleteProjectDialog.open();
                                    document.getElementById("delete-project-btn").addEventListener("click", function (event) {
                                        deleteProjectDialog.close();
                                        event.stopImmediatePropagation();
                                        const localCheckedProjects = checkedProjects;
                                        for (let i = 0; i < localCheckedProjects.length; i++) {
                                            // does this project actually exists?
                                            const project = Code.getProjectByID(localCheckedProjects[i]);
                                            if (project !== undefined) {
                                                checkedProjects.slice(localCheckedProjects.indexOf(localCheckedProjects[i]), 1);
                                                Code.deleteProject(localCheckedProjects[i]);
                                            }
                                        }
                                        selectedProjectsControls.style.display = 'none';
                                    });
                                });
                                document.getElementById("export-selected-project-btn").addEventListener("click", function (event) {
                                    event.stopImmediatePropagation();
                                    const exportMultipleProjectsDialogElem = document.querySelector(".export-multiple-projects-dialog");
                                    const exportMultipleProjectsDialog = new mdc.dialog.MDCDialog(exportMultipleProjectsDialogElem);
                                    const exportAsZipRadio = new mdc.radio.MDCRadio(document.querySelector("#export-zip"));
                                    const exportAsMultipleFilesRadio = new mdc.radio.MDCRadio(document.querySelector("#export-multiple"));
                                    const formField = new mdc.formField.MDCFormField(document.querySelector('.mdc-form-field'));
                                    formField.input = exportAsZipRadio;
                                    if (checkedProjects.length > 1) {
                                        exportMultipleProjectsDialog.open();
                                        const exportProjectDialogButton = document.getElementById("export-project-dialog-button");
                                        exportProjectDialogButton.addEventListener("click", function () {
                                            let project;
                                            if (exportAsMultipleFilesRadio.checked) {
                                                for (let y = 0; y < checkedProjects.length; y++) {
                                                    project = Code.getProjectByID(checkedProjects[y]);
                                                    Code.loadProject(project, true);
                                                    Code.createProjectFile(project, (content, name) => {
                                                        saveAs(content, name + ".abx");
                                                    }, false);
                                                }
                                            } else {
                                                let createdProjectFiles = 0;
                                                const zip = new JSZip();
                                                for (let i = 0; i < checkedProjects.length; i++) {
                                                    project = Code.getProjectByID(checkedProjects[i]);
                                                    Code.loadProject(project, true);
                                                    Code.createProjectFile(project, (content, name) => {
                                                        createdProjectFiles++;
                                                        console.log(createdProjectFiles);
                                                        console.log(checkedProjects.length);
                                                        zip.file(name + ".abx", content);
                                                        if (createdProjectFiles === checkedProjects.length) {
                                                            zip.generateAsync({type: "blob"}).then(function (content) {
                                                                saveAs(content, "projects.zip");
                                                            });
                                                        }
                                                    }, false);
                                                }
                                            }
                                            selectedProjectsControls.style.display = 'none';
                                        });
                                    }
                                });
                            } else {
                                projectsControls.style.display = 'block';
                                selectedProjectsControls.style.display = 'none';
                            }
                        } else if (event.target.id.startsWith("project-")) {
                            event.stopImmediatePropagation(); // so we don't get events multiple times
                            const id1 = event.target.id.replaceAll("project-", "");
                            const project = Code.getProjectByID(id1);
                            if (project !== undefined && checkedProjects.length === 0) {
                                Code.loadProject(project);
                            }
                        }
                    });
                }
            }
        },
        error: function (xhr, status, error) {
            var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.error-snackbar'));
            snackbar.labelText = "The backend is temporarily unavailable.";
            snackbar.open();
        }
    });
};

Code.resolveUserID = function () {
    $.ajax({
        type: 'GET',
        url: Code.API_SERVER_URL + "/user/" + firebase.auth().currentUser.uid,
        contentType: 'application/json', success: function (resut, status, xhr) {
            const json = JSON.parse(xhr.responseText)[0];
            userId = json._id;
            console.log(json);
            githubAccessToken = json['githubToken'];
            Code.loadProjects();
        },
        error: function (xhr, status, error) {
            var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.error-snackbar'));
            snackbar.labelText = "The server is temporarily unavailable.";
            snackbar.open();
        }
    });
};

window.addEventListener('load', Code.init);