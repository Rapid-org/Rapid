/**
 * Blockly Demos: Code
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Blockly's Code demo.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Code = {};

Code.BUILD_SERVER_URL = "http://localhost:8080"

/**
 * Lookup for names of supported languages.  Keys should be in ISO 639 format.
 */
Code.LANGUAGE_NAME = {
    'ar': 'العربية',
    'be-tarask': 'Taraškievica',
    'br': 'Brezhoneg',
    'ca': 'Català',
    'cs': 'Česky',
    'da': 'Dansk',
    'de': 'Deutsch',
    'el': 'Ελληνικά',
    'en': 'English',
    'es': 'Español',
    'fa': 'فارسی',
    'fr': 'Français',
    'he': 'עברית',
    'hrx': 'Hunsrik',
    'hu': 'Magyar',
    'ia': 'Interlingua',
    'is': 'Íslenska',
    'it': 'Italiano',
    'ja': '日本語',
    'ko': '한국어',
    'mk': 'Македонски',
    'ms': 'Bahasa Melayu',
    'nb': 'Norsk Bokmål',
    'nl': 'Nederlands, Vlaams',
    'oc': 'Lenga d\'òc',
    'pl': 'Polski',
    'pms': 'Piemontèis',
    'pt-br': 'Português Brasileiro',
    'ro': 'Română',
    'ru': 'Русский',
    'sc': 'Sardu',
    'sk': 'Slovenčina',
    'sr': 'Српски',
    'sv': 'Svenska',
    'th': 'ภาษาไทย',
    'tlh': 'tlhIngan Hol',
    'tr': 'Türkçe',
    'uk': 'Українська',
    'vi': 'Tiếng Việt',
    'zh-hans': '簡體中文',
    'zh-hant': '正體中文'
};

/**
 * List of RTL languages.
 */
Code.LANGUAGE_RTL = ['ar', 'fa', 'he'];

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

var currentProjectId;
var userId;
var isServerBusy = false;
var projectsObj;
var currentProject;
var qrCode;
var importProjectDialog;
var projectBuildFailedDialog;
var fileSelected;

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if paramater not found.
 * @return {string} The parameter value or the default value if not found.
 */
Code.getStringParamFromUrl = function(name, defaultValue) {
    var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

Code.download = function(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:java/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

/**
 * Get the language of this user from the URL.
 * @return {string} User's language.
 */
Code.getLang = function() {
    var lang = Code.getStringParamFromUrl('lang', '');
    if (Code.LANGUAGE_NAME[lang] === undefined) {
        // Default to English.
        lang = 'en';
    }
    return lang;
};


/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
Code.getBBox_ = function(element) {
    var height = element.offsetHeight;
    var width = element.offsetWidth;
    var x = 0;
    var y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    return {
        height: height,
        width: width,
        x: x,
        y: y
    };
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function() {
    document.querySelectorAll('.mdc-button').forEach(
        function(ele) {
            mdc.ripple.MDCRipple.attachTo(ele);
        });
    document.querySelectorAll('.mdc-checkbox').forEach(
        function(ele) {
            mdc.checkbox.MDCCheckbox.attachTo(ele);
        });
    var generalElem = document.getElementById("general");
    var publishingElem = document.getElementById("publishing");
    var androidManifestElem = document.getElementById("android-manifest");
    new mdc.tabBar.MDCTabBar(document.querySelector(".mdc-tab-bar")).listen("MDCTabBar:activated", function(a) {
        var index = a.detail.index;
        if (index == 0) {
            generalElem.style.display = 'block';
            publishingElem.style.display = 'none';
            androidManifestElem.style.display = 'none';
        } else if (index == 1) {
            generalElem.style.display = 'none';
            publishingElem.style.display = 'block';
            androidManifestElem.style.display = 'none';
        } else if (index == 2) {
            generalElem.style.display = 'none';
            publishingElem.style.display = 'none';
            androidManifestElem.style.display = 'block';
            editor.refresh();
        }
    });
    var code = document.getElementById("code");
    var editor = CodeMirror.fromTextArea(code, {
        mode: "xml",
        theme: 'idea',
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true,
        autoCloseTags: true,
        lineNumbers: true,
        foldGutter: true
    });
    new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'));
    const newProjectDialog = new mdc.dialog.MDCDialog(document.querySelector('.new-project-dialog'));
    document.getElementById("createnewproject").addEventListener("click", function() {
        newProjectDialog.open();
    });
    document.getElementById("noprojects-createnewproject").addEventListener("click", function() {
        newProjectDialog.open();
    });
    document.querySelectorAll('.mdc-text-field').forEach(
        function(ele) {
            new mdc.textField.MDCTextField(ele);
        });
    const importProjectDialogElem = document.querySelector(".import-project-dialog");
    importProjectDialog = new mdc.dialog.MDCDialog(importProjectDialogElem);
    const importMenuEelem = document.querySelector("#import-project");
    importMenuEelem.addEventListener("click", function() {
        // reinitializes the dialog
        document.querySelector('.project-preview').classList.add('hidden');
        document.getElementById("import-button").disabled = "disabled";
        importProjectDialog.open();
    });
    document.getElementById("import-project-btn").addEventListener("click", function() {
        document.querySelector('.project-preview').classList.add('hidden');
        document.getElementById("import-button").disabled = "disabled";
        importProjectDialog.open();
    });
    const fileMenuElem = document.querySelector('.file-menu');
    const fileMenuButtonElem = document.getElementById("file-button");
    const fileMenu = new mdc.menu.MDCMenu(fileMenuElem);
    fileMenuButtonElem.addEventListener("click", function() {
        fileMenu.open = !fileMenu.open;
        fileMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        fileMenu.setAnchorElement(fileMenuButtonElem);
    });
    const toolsMenuElem = document.querySelector('.tools-menu');
    const toolsMenuButtonElem = document.getElementById("tools-button");
    const toolsMenu = new mdc.menu.MDCMenu(toolsMenuElem);
    toolsMenuButtonElem.addEventListener("click", function() {
        toolsMenu.open = !fileMenu.open;
        toolsMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        toolsMenu.setAnchorElement(toolsMenuButtonElem);
    });
    const publishToGithubMenuItem = document.getElementById("publish-github");
    publishToGithubMenuItem.addEventListener("click", function() {
        const gh = new GitHub();
        console.log(gh);
    })
    document.getElementById("file-upload-btn").addEventListener("change", function() {
        var file = this.files[0];
        document.getElementById("project-preview-name").innerHTML = file.name;
        document.querySelector('.project-preview').classList.remove('hidden');
        document.querySelector('.project-preview').style.display = 'flex';
        Code.doImport(file);
    });
    document.getElementById("asset-file-upload-btn").addEventListener("change", function() {
        var file = this.files[0];
        fileSelected = file;
        document.getElementById("project-asset-preview-name").innerHTML = file.name;
        document.querySelector('.project-asset-preview').classList.remove('hidden');
        document.querySelector('.project-asset-preview').style.display = 'flex';
        const importButton = document.getElementById("asset-import-button");
        importButton.removeAttribute("disabled");
    });
    // configure drag & drop to upload for importing projects
    $(document).ready(function() {
        var holder = document.getElementById('holder');
        var assetHolder = document.getElementById('asset-holder');
        holder.ondragover = function() { this.className = 'hover'; return false; };
        holder.ondrop = function(e) {
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
        assetHolder.ondragover = function() { this.className = 'hover'; return false; };
        assetHolder.ondrop = function(e) {
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
    uploadIconElem.addEventListener("click", function() {
        Code.openAssetsDialog();
    });
    const buildMenuElem = document.querySelector('.build-menu');
    const buildMenuButtonElem = document.getElementById("build-button");
    const buildMenu = new mdc.menu.MDCMenu(buildMenuElem);
    buildMenuButtonElem.addEventListener("click", function() {
        buildMenu.open = !buildMenu.open;
        buildMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        buildMenu.setAnchorElement(buildMenuButtonElem);
    });
    const userMenuElem = document.querySelector('.user-menu');
    const userimage = document.getElementById("userimage");
    const userMenu = new mdc.menu.MDCMenu(userMenuElem);
    userimage.addEventListener("click", function() {
        userMenu.open = !userMenu.open;
        userMenu.setAnchorCorner(mdc.menu.Corner.BOTTOM_RIGHT);
        userMenu.setAnchorElement(userimage);
    });

    const buildDebugProject = document.getElementById("build-debug-project");
    buildDebugProject.addEventListener("click", function() {
        Code.buildProject(true);
    });
    const buildPublishProject = document.getElementById("build-publish-project");
    buildPublishProject.addEventListener("click", function() {
        Code.buildProject(false);
    });
    const signOut = document.getElementById("sign-out");
    signOut.addEventListener("click", function() {
        firebase.auth().signOut();
    })
    const saveProject = document.getElementById("save-project");
    saveProject.addEventListener("click", function() {
        Code.saveProject();
        var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.info-snackbar'));
        snackbar.labelText = "Project Saved.";
        snackbar.open();
    });
    const deleteProjectDialogElem = document.querySelector(".delete-project-dialog");
    const deleteProjectDialog = new mdc.dialog.MDCDialog(deleteProjectDialogElem);
    const deleteProject = document.getElementById("delete-project");
    const deleteProjectDialogTitle = document.getElementById("delete-project-dialog-title");
    const deleteProjectDialogContent = document.getElementById("delete-dialog-content");
    deleteProject.addEventListener("click", function() {
        deleteProjectDialogTitle.innerHTML = 'Are you sure you want to delete "' + currentProject['name'] + '"?';
        deleteProjectDialogContent.innerHTML = 'You are about to delete "' + currentProject['name'] + '", after deleting it, <b>There will be absolutely no way to resotre it back!</b> Make sure to take a backup in case you want to use it back again.';
        deleteProjectDialog.open();
        document.getElementById("delete-project-btn").addEventListener("click", function() {
            Code.deleteCurrentProject();
        });
    });
    const projectBuildFailedDialogElem = document.querySelector(".build-failed-dialog");
    projectBuildFailedDialog = new mdc.dialog.MDCDialog(projectBuildFailedDialogElem);
    const exportProject = document.getElementById("export-project");
    exportProject.addEventListener("click", function() {
        Code.createProjectFile(function(content) {
            saveAs(content, currentProject['name'] + ".abx");
        }, false);
    });
    const newProjectMenuitem = document.getElementById("new-project");
    newProjectMenuitem.addEventListener("click", function() {
        newProjectDialog.open();
    });
    const myProjectsMenuitem = document.getElementById("my-projects");
    myProjectsMenuitem.addEventListener("click", function() {
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
            var PATH_TO_AUTH = "../auth/index.html";
            window.location.href = PATH_TO_AUTH;
        }
    });
    var projectNameInput = document.getElementById("newprojectdialog-name-input");
    var projectDescriptionInput = document.getElementById("newprojectdialog-description-input");
    var packageNameInput = document.getElementById("newprojectdialog-packagename-input");
    var createProjectButton = document.getElementById("create-button");
    projectNameInput.addEventListener("input", function() {
        validateInputs();
    });
    packageNameInput.addEventListener("input", function() {
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
        return !/[A-Za-z_$]+[a-zA-Z0-9_$]*/.test(projectNameInput.value) || projectNameInput.value.length == 0 || '0123456789'.indexOf(projectNameInput.value[0]) != -1;
    }

    function isPackageNameInputInvalid() {
        return !/(?!^abstract$|^abstract\..*|.*\.abstract\..*|.*\.abstract$|^assert$|^assert\..*|.*\.assert\..*|.*\.assert$|^boolean$|^boolean\..*|.*\.boolean\..*|.*\.boolean$|^break$|^break\..*|.*\.break\..*|.*\.break$|^byte$|^byte\..*|.*\.byte\..*|.*\.byte$|^case$|^case\..*|.*\.case\..*|.*\.case$|^catch$|^catch\..*|.*\.catch\..*|.*\.catch$|^char$|^char\..*|.*\.char\..*|.*\.char$|^class$|^class\..*|.*\.class\..*|.*\.class$|^const$|^const\..*|.*\.const\..*|.*\.const$|^continue$|^continue\..*|.*\.continue\..*|.*\.continue$|^default$|^default\..*|.*\.default\..*|.*\.default$|^do$|^do\..*|.*\.do\..*|.*\.do$|^double$|^double\..*|.*\.double\..*|.*\.double$|^else$|^else\..*|.*\.else\..*|.*\.else$|^enum$|^enum\..*|.*\.enum\..*|.*\.enum$|^extends$|^extends\..*|.*\.extends\..*|.*\.extends$|^final$|^final\..*|.*\.final\..*|.*\.final$|^finally$|^finally\..*|.*\.finally\..*|.*\.finally$|^float$|^float\..*|.*\.float\..*|.*\.float$|^for$|^for\..*|.*\.for\..*|.*\.for$|^goto$|^goto\..*|.*\.goto\..*|.*\.goto$|^if$|^if\..*|.*\.if\..*|.*\.if$|^implements$|^implements\..*|.*\.implements\..*|.*\.implements$|^import$|^import\..*|.*\.import\..*|.*\.import$|^instanceof$|^instanceof\..*|.*\.instanceof\..*|.*\.instanceof$|^int$|^int\..*|.*\.int\..*|.*\.int$|^interface$|^interface\..*|.*\.interface\..*|.*\.interface$|^long$|^long\..*|.*\.long\..*|.*\.long$|^native$|^native\..*|.*\.native\..*|.*\.native$|^new$|^new\..*|.*\.new\..*|.*\.new$|^package$|^package\..*|.*\.package\..*|.*\.package$|^private$|^private\..*|.*\.private\..*|.*\.private$|^protected$|^protected\..*|.*\.protected\..*|.*\.protected$|^public$|^public\..*|.*\.public\..*|.*\.public$|^return$|^return\..*|.*\.return\..*|.*\.return$|^short$|^short\..*|.*\.short\..*|.*\.short$|^static$|^static\..*|.*\.static\..*|.*\.static$|^strictfp$|^strictfp\..*|.*\.strictfp\..*|.*\.strictfp$|^super$|^super\..*|.*\.super\..*|.*\.super$|^switch$|^switch\..*|.*\.switch\..*|.*\.switch$|^synchronized$|^synchronized\..*|.*\.synchronized\..*|.*\.synchronized$|^this$|^this\..*|.*\.this\..*|.*\.this$|^throw$|^throw\..*|.*\.throw\..*|.*\.throw$|^throws$|^throws\..*|.*\.throws\..*|.*\.throws$|^transient$|^transient\..*|.*\.transient\..*|.*\.transient$|^try$|^try\..*|.*\.try\..*|.*\.try$|^void$|^void\..*|.*\.void\..*|.*\.void$|^volatile$|^volatile\..*|.*\.volatile\..*|.*\.volatile$|^while$|^while\..*|.*\.while\..*|.*\.while$)(^(?:[a-z_]+(?:\d*[a-zA-Z_]*)*)(?:\.[a-z_]+(?:\d*[a-zA-Z_]*)*)*$)/.test(packageNameInput.value) || packageNameInput.value.length == 0;
    }
    createProjectButton.addEventListener("click", function() {
        Code.createNewProject(projectNameInput.value, projectDescriptionInput.value, packageNameInput.value);
    });
    var projectOptionsMenuItem = document.getElementById("project-options");
    projectOptionsMenuItem.addEventListener("click", function() {
        var projectOptionsDialogEnum = document.querySelector(".project-options-dialog");
        var projectOptionsDialog = new mdc.dialog.MDCDialog(projectOptionsDialogEnum);
        document.getElementById("close-options-dialog-icon").addEventListener("click", function() {
            projectOptionsDialog.close();
        });
        projectOptionsDialog.open();
        var projectNameInput = document.getElementById("project-name-field");
        projectNameInput.value = currentProject['name'];
        var projectPackageNameInput = document.getElementById("project-package-name-field");
        projectPackageNameInput.value = currentProject['packageName'];
        var projectDescriptionInput = document.getElementById("project-description-field");
        projectDescriptionInput.value = currentProject['description'];
        var projectVersionNameInput = document.getElementById("project-version-name-field");
        projectVersionNameInput.value = currentProject['versionName'];
        var projectVersionNameInput = document.getElementById("project-version-name-field");
        projectVersionNameInput.value = currentProject['versionName'];
        var projectVersionNumberInput = document.getElementById("project-version-number-field");
        projectVersionNumberInput.value = currentProject['versionNumber'];
        var projectHomeWebsiteInput = document.getElementById("project-home-website-field");
        projectHomeWebsiteInput.value = currentProject['homeWebsite'];
        var projectMinSdkInput = document.getElementById("project-min-sdk-select");
        var projectIconInput = document.getElementById("project-icon-field");
        projectIconInput.value = currentProject['icon'];
        const select = new mdc.select.MDCSelect(projectMinSdkInput);
        select.value = currentProject['minSdk'];
        var autoIncrementOnPublishCheckbox = document.getElementById("incrementonpublish-checkbox");
        autoIncrementOnPublishCheckbox.checked = (currentProject['incrementOnPublish'] == 'true');
        var proguardCheckbox = document.getElementById("proguard-checkbox");
        proguardCheckbox.checked = (currentProject['proguard'] == 'true');
        editor.setValue(unescape(currentProject['androidManifest']));
        projectDescriptionInput.focus();
        projectPackageNameInput.focus();
        projectNameInput.focus();
        projectVersionNameInput.focus();
        projectVersionNumberInput.focus();
        projectHomeWebsiteInput.focus();
        projectMinSdkInput.click();
        projectIconInput.focus();
        var saveButtonElem = document.getElementById("settings-dialog-save-button");
        saveButtonElem.addEventListener("click", function() {
            var keys = [];
            var values = [];
            if (projectNameInput.value != currentProject['name']) {
                keys.push('name');
                values.push(projectNameInput.value);
            }
            if (projectDescriptionInput.value != currentProject['description']) {
                keys.push('description');
                values.push(projectDescriptionInput.value);
            }
            if (projectPackageNameInput.value != currentProject['packageName']) {
                keys.push('packageName');
                values.push(projectPackageNameInput.value);
            }
            if (projectVersionNameInput.value != currentProject['versionName']) {
                keys.push('versionName');
                values.push(projectVersionNameInput.value);
            }
            if (projectVersionNumberInput.value != currentProject['versionNumber']) {
                keys.push('versionNumber');
                values.push(projectVersionNumberInput.value);
            }
            if (projectHomeWebsiteInput.value != currentProject['homeWebsite']) {
                keys.push('homeWebsite');
                values.push(projectHomeWebsiteInput.value);
            }
            if (select.value != currentProject['minSdk']) {
                keys.push('minSdk');
                values.push(select.value);
            }
            if (select.value != currentProject['minSdk']) {
                keys.push('minSdk');
                values.push(select.value);
            }
            if (projectIconInput.value != currentProject['icon']) {
                keys.push('icon');
                values.push(projectIconInput.value);
            }
            if (autoIncrementOnPublishCheckbox.checked != (currentProject['incrementOnPublish'] == "true")) {
                keys.push('incrementOnPublish');
                values.push(autoIncrementOnPublishCheckbox.checked ? "true" : "false");
            }
            if (proguardCheckbox.checked != (currentProject['proguard'] == "true")) {
                keys.push('proguard');
                values.push(proguardCheckbox.checked ? "true" : "false");
            }
            console.log(editor.getValue());
            if (editor.getValue() != currentProject['androidManifest']) {
                keys.push('androidManifest');
                values.push(mysql_real_escape_string(editor.getValue()));
            }
            if (keys.length) {
                Code.updateCurrentProject(values, keys, function() {
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

function getBase64(file, callback) {
    console.log(file);
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
        callback.call(reader.result);
    };
    reader.onerror = function(error) {
        console.log('Error: ', error);
    };
}

Code.openAssetsDialog = function() {
    var importAssetProjectDialogElem = document.querySelector(".import-asset-dialog");
    var importAssetProjectDialog = new mdc.dialog.MDCDialog(importAssetProjectDialogElem);
    importAssetProjectDialog.open();
    var importButton = document.getElementById("asset-import-button");
    var projectIconTextField = document.getElementById("project-icon-field");
    importButton.addEventListener("click", function() {
        getBase64(fileSelected, function() {
            projectIconTextField.value = this;
        });
    });
};

function showProjectSettingsUpdated() {
    var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.info-snackbar'));
    snackbar.labelText = "Project Settings Updated.";
    snackbar.open();
}

Code.updateCurrentProject = function(values, keys, callback) {
    if (isServerBusy) {
        return;
    }
    isServerBusy = true; // disallow requests when there is already a request being sent.
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://aixbuilder.000webhostapp.com/updateProject.php", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            isServerBusy = false;
            callback.call(xhr.status == 200);
            if (xhr.status == 200) {
                for (var i = 0; i < keys.length; i++) {
                    currentProject[keys[i]] = values[i];
                }
            } else if (xhr.status == 409) {
                // the 409 error status code is send from the servers when a project with the same name exists in this account.
                var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));
                snackbar.labelText = "A project with the same name already exists!";
                snackbar.open();
            }
        }
    }
    var queryParameters = "key=aixbuildr@@584390&" +
        "projectId=" + currentProjectId + "&userId=" + userId;
    for (var i = 0; i < keys.length; i++) {
        queryParameters += "&" + keys[i] + "=" + values[i];
    }
    console.log(queryParameters);
    xhr.send(queryParameters);
};

Code.buildProject = function(debug) {
    if (!debug && (currentProject['incrementOnPublish'] == 'true')) {
        console.log([currentProject['versionNumber']++], ['versionNumber']);
        Code.updateCurrentProject([currentProject['versionNumber']++], ['versionNumber'], function() {
            Code.buildProject_(debug);
        });
        return;
    }
    Code.buildProject_(debug);
};

function mysql_real_escape_string(str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
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

Code.buildProject_ = function(debug) {
    const buildPopup = document.getElementById("projectbuilding-popup");
    const buildPopupLabel = document.getElementById("building-popup-label");
    buildPopupLabel.innerHTML = "Building " + currentProject['name'] + "..";
    buildPopup.style.visibility = "visible";
    Code.createProjectFile(function(content) {
        var fd = new FormData();
        fd.append('input', content);
        $.ajax({
            type: 'POST',
            url: Code.BUILD_SERVER_URL + '/build',
            data: fd,
            timeout: 15000,
            processData: false,
            contentType: false
        }).done(function(data) {
            buildPopup.style.visibility = "hidden";
            var json = JSON.parse(data);
            var success = json['success'];
            console.log(data);
            if (success) {
                const qrCodeElem = document.getElementById('qrcode');
                if (qrCode != undefined) {
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
                var okButton = document.getElementById("build-dialog-ok-button");
                okButton.addEventListener("click", function() {
                    buildDialog.close();
                });
                var buildFailedOkButton = document.getElementById("build-failed-dialog-ok-button");
                buildFailedOkButton.addEventListener("click", function() {
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
        }).fail(function() {
            buildPopup.style.visibility = "hidden";
            var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.error-snackbar'));
            snackbar.labelText = "The buildserver is temporarily unavailable.";
            console.log(snackbar);
            snackbar.open();
        });
    }, !debug);
}

Code.doImport = function(file) {
    let reader = new FileReader();
    var name;
    var packageName;
    var description;
    var zipFile;
    const importButton = document.getElementById("import-button");
    reader.onload = function(e) {
        JSZip.loadAsync(e.target.result)
            .then(function(zip) {
                zipFile = zip;
                return zip.file("extension.json").async("string");
            }).then(function(extensionJson) {
                var json = JSON.parse(extensionJson);
                console.log(json);
                document.getElementById("project-preview-description").innerHTML = json['description'];
                name = json['name'];
                description = json['description'];
                packageName = json['packageName'];
                return zipFile.file("src/main/blocks/" + name + ".xml").async("string");
            }).then(function(blocksMapping) {
                importButton.removeAttribute("disabled");
                importButton.addEventListener("click", function(e) {
                    e.stopImmediatePropagation();
                    importProjectDialog.close();
                    Code.createNewProject(name, description, packageName, blocksMapping);
                });
            });
    };
    reader.readAsArrayBuffer(file);
}

Code.deleteCurrentProject = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://aixbuilder.000webhostapp.com/deleteProject.php", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            Code.unloadCurrentProject(); // don't show a deleted project
            document.getElementById("loadingProject").style.display = "table-cell";
            Code.loadProjects(); // reload projects for the project deletion to take place.
        }
    }
    xhr.send("key=aixbuildr@@584390&" +
        "id=" + currentProjectId);
};

Code.createProjectFile = function(callback, release) {
    var zip = new JSZip();
    var sourceDirectory = "src/main/java/" + currentProject['packageName'].replaceAll(".", "/");
    var blocksDirectory = "src/main/blocks";
    // holds the extension information, parsed in the buildserver or when importing a project
    var extensionJson = {
        "name": currentProject['name'],
        "packageName": currentProject['packageName'],
        "proguard": release ? currentProject['proguard'] : "false"
    };
    zip.file("extension.json", JSON.stringify(extensionJson));
    zip.file("AndroidManifest.xml", decodeURIComponent(currentProject['androidManifest']));
    zip.folder(sourceDirectory);
    zip.folder(blocksDirectory);
    Code.workspace.options.appTitle = currentProject['name'];
    Blockly.Java.setPackage(currentProject['packageName']);
    Blockly.Java.setDescription(currentProject["description"]);
    Blockly.Java.setVersionName(currentProject["versionName"]);
    Blockly.Java.setVersionNumber(currentProject["versionNumber"]);
    Blockly.Java.setHomeWebsite(currentProject["homeWebsite"]);
    Blockly.Java.setMinSdk(currentProject['minSdk']);
    Blockly.Java.setIcon(currentProject['icon']);
    Blockly.Java.setName(firebase.auth().currentUser.displayName);
    var code = Blockly.Java.workspaceToCode(Code.workspace);
    zip.file(sourceDirectory + "/" + currentProject['name'] + ".java", code);
    var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    zip.file(blocksDirectory + "/" + currentProject['name'] + ".xml", xmlText);
    zip.generateAsync({ type: "blob" }).then(callback);
};

Code.coloursFlyoutCallback = function(workspace) {
    // Returns an array of hex colours, e.g. ['#4286f4', '#ef0447']
    var colourList = myApplication.getPalette();
    var xmlList = [];
    if (Blockly.Blocks['colour_picker']) {
        for (var i = 0; i < colourList.length; i++) {
            var blockText = '<block type="colour_picker">' +
                '<field name="COLOUR">' + colourList[i] + '</field>' +
                '</block>';
            var block = Blockly.Xml.textToDom(blockText);
            xmlList.push(block);
        }
    }
    return xmlList;
};

Code.uploadAsset = function(key, callback) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData();
    let photo = fileSelected;

    formData.append("fileToUpload", photo);
    formData.append("userId", userId);
    formData.append("projectId", currentProjectId);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
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

Code.createNewProject = function(projectName, projectDescription, packageName, blocks_opt) {
    var blocks = blocks_opt || "";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://aixbuilder.000webhostapp.com/createProject.php", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var projectObj = JSON.parse(xhr.responseText)[0];
                Code.loadProjects();
                if (blocks.length != 0) {
                    projectObj['blocks'] = blocks_opt;
                }
                Code.loadProject(projectObj);
            } else if (xhr.status == 409) {
                // the 409 error status code is send from the servers when a project with the same name exists in this account.
                var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));
                snackbar.labelText = "A project with the same name already exists!";
                snackbar.open();
            }
        }
    }
    xhr.send("key=aixbuildr@@584390&" +
        "name=" + projectName + "&" +
        "description=" + projectDescription + "&" +
        "packageName=" + packageName + "&" +
        "userId=" + userId);
};

Code.saveProject = function() {
    isServerBusy = true; // disallow requests when there is already a request being sent.
    var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://aixbuilder.000webhostapp.com/updateProject.php", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                isServerBusy = false;
            }
        }
        //xhr.send("key=aixbuildr@@584390&" +
        //  "projectId=" + currentProjectId + "&" +
        //"blocks=" + encodeURIComponent(xmlText));
};

Code.unloadCurrentProject = function() {
    currentProjectId = 0;
    currentProject = undefined;
    Blockly.mainWorkspace.dispose();
    var blocklyDiv = document.getElementById("blocklyDiv");
    blocklyDiv.remove();
    var blocklyToolboxDiv = document.querySelector(".blocklyToolboxDiv");
    blocklyToolboxDiv.remove();
    var projectsView = document.getElementById('projectsView');
    var projectsControlls = document.getElementById('projectsControlls');
    projectsView.style.display = 'table';
    projectsControlls.style.display = 'block';
    var projectToolbar = document.getElementById("project-toolbar");
    projectToolbar.style.visibility = "hidden";
};

Code.loadProject = function(projectObj) {
    if (currentProject) {
        this.unloadCurrentProject();
    }
    currentProjectId = projectObj['id'];
    currentProject = projectObj;
    var blocklyDiv = document.createElement('div');
    blocklyDiv.id = 'blocklyDiv';
    blocklyDiv.style = 'position: absolute; height: 84vh; width: 100%;';
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
    if ((projectObj['blocks'] != null && projectObj['blocks'].length != 0)) {
        var xml = Blockly.Xml.textToDom(decodeURIComponent(projectObj['blocks']).replaceAll('+', ' '));
        console.log(Code.workspace);
        Blockly.Xml.domToWorkspace(Code.workspace, xml);
    }
    var projectsView = document.getElementById('projectsView');
    var projectsControlls = document.getElementById('projectsControlls');
    var noProjects = document.getElementById("noprojects");
    projectsView.style.display = 'none';
    projectsControlls.style.display = 'none';
    noProjects.style.display = 'none';
    var projectToolbar = document.getElementById("project-toolbar");
    projectToolbar.style.visibility = "visible";
    Code.workspace.addChangeListener(function() {
        if (!isServerBusy) {
            Code.saveProject();
        }
    });
};

Code.getProjectByID = function(id) {
    for (var i = 0; i < projectsObj.length; i++) {
        if (projectsObj[i].id == id) {
            return projectsObj[i];
        }
    }
    return undefined;
};

Code.loadProjects = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://aixbuilder.000webhostapp.com/getProjectsById.php", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText);
            projectsObj = JSON.parse(xhr.responseText);
            var loadingProjectsElem = document.getElementById("loadingProject");
            loadingProjectsElem.style.display = "none";
            if (projectsObj.length == 0) {
                var noProjectsElem = document.getElementById("noprojects");
                noProjectsElem.style.display = "table-row";
                var projects = document.getElementById('projects');
                projects.style.display = 'none';
            } else {
                var projectsElem = document.getElementById("projects");
                projectsElem.style.display = "table-row";
                var projectsList = document.getElementById("projectsList");
                projectsList.innerHTML = "";
                for (var i = 0; i < projectsObj.length; i++) {
                    projectsList.innerHTML += `<li class="mdc-list-item project-list-item" id=` + "project-" + projectsObj[i]['id'] + ` style="border-radius: 6px;margin-right: 10px;">
              <span class="mdc-list-item__ripple"></span>
              <span class="mdc-list-item__text">
                <span class="mdc-list-item__primary-text">` + projectsObj[i]['name'] + `</span>
                <span class="mdc-list-item__secondary-text">` + projectsObj[i]['description'] + `</span>
              </span>
            </li>`

                    document.querySelectorAll(".mdc-list-item").forEach(function(elem) {
                        mdc.ripple.MDCRipple.attachTo(elem);
                    });
                    var currentProject = projectsObj[i];
                    console.log(currentProject);
                    console.log(i);
                    console.log(document.querySelectorAll(".mdc-list-item").item(i));
                    document.addEventListener("click", function(event) {
                        if (event.target.id.includes("project-")) {
                            event.stopImmediatePropagation(); // so we don't get events multiple times
                            var id = event.target.id.replaceAll("project-", "");
                            var project = Code.getProjectByID(id);
                            if (project != undefined) {
                                Code.loadProject(project);
                            }
                        }
                    });
                }
            }
        }
    }
    xhr.send("key=aixbuildr@@584390&" +
        "id=" + userId);
};

Code.resolveUserID = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://aixbuilder.000webhostapp.com/getUserByUid.php", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            userId = JSON.parse(xhr.responseText)[0].id;
            Code.loadProjects();
        }
    }
    xhr.send("key=aixbuildr@@584390&" +
        "uid=" + firebase.auth().currentUser.uid);
}

Code.initDefaultCode = function() {
    var xmlText = "<xml xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\">\r\n  <block type=\"procedures_defnoreturn\" x=\"0\" y=\"0\">\r\n    <field name=\"NAME\">MyFunction<\/field>\r\n    <statement name=\"STACK\">\r\n      <block type=\"text_print\">\r\n        <value name=\"TEXT\">\r\n          <block type=\"text\">\r\n            <field name=\"TEXT\">Hello World!<\/field>\r\n          <\/block>\r\n        <\/value>\r\n      <\/block>\r\n    <\/statement>\r\n  <\/block>\r\n<\/xml>";
    if (typeof xmlText != "string" || xmlText.length < 5) {
        return false;
    }
    try {
        var dom = Blockly.Xml.textToDom(xmlText);
        Blockly.mainWorkspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, dom);
        return true;
    } catch (e) {
        return false;
    }
};

window.addEventListener('load', Code.init);