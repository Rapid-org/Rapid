import './App.scss';
import logo from "./logo.png";
import React from "react";
import JSZip from 'jszip';
import {
    Autocomplete,
    Avatar, Backdrop,
    Box, Checkbox,
    Dialog,
    DialogActions,
    DialogContent, DialogContentText,
    DialogTitle,
    Divider, IconButton, InputAdornment, List, ListItem, ListItemAvatar, ListItemButton, ListItemText,
    Snackbar, Tabs, Radio,
    TextField, Tooltip, Tab, FormControlLabel, Switch, FormGroup, FormHelperText, FormControl, RadioGroup, Alert
} from '@mui/material';
import PropTypes from 'prop-types';
import {
    Add,
    Backup,
    BugReport,
    Delete,
    Download,
    ExitToApp,
    Folder,
    NewReleases,
    Save,
    Settings,
    Upload,
    AutoAwesome,
    Extension,
    Publish
} from '@mui/icons-material';
import {Button, createTheme, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {CircularProgress, ThemeProvider} from "@mui/material";
import UserManager from './UserManager';
import ProjectManager from './ProjectsManager';
import BlocklyWorkspace from './BlocklyWorkspace';
import {saveAs} from "file-saver";
import {FileDrop} from "react-file-drop";
import {Portal} from '@mui/material';
import $ from 'jquery';
import QRCode from "react-qr-code";
import firebase from "firebase/compat";
import 'firebase/messaging/sw';

const generate = require('project-name-generator');

let BUILD_SERVER_URL = "http://localhost:8080";
let firebaseApp;
const androidSdks = [
    {label: 'Android 2.1 ( Api 7 )', api: 7},
    {label: 'Android 2.2.x ( Api 8 )', api: 8},
    {label: 'Android 2.3 - 2.3.2 ( Api 9 )', api: 9},
    {label: 'Android 2.3.3 - 2.3.7 ( Api 10 )', api: 10},
    {label: 'Android 3.0 ( Api 11 )', api: 11},
    {label: 'Android 3.1 ( Api 12 )', api: 12},
    {label: 'Android 3.2.x ( Api 13 )', api: 13},
    {label: 'Android 4.0.3 - 4.0.4 ( Api 15 )', api: 15},
    {label: 'Android 4.1.x ( Api 16 )', api: 16},
    {label: 'Android 4.2.x ( Api 17 )', api: 17},
    {label: 'Android 4.3.x ( Api 18 )', api: 18},
    {label: 'Android 4.4 - 4.4.4 ( Api 19 )', api: 19},
    {label: 'Android 5.0 ( Api 21 )', api: 21},
    {label: 'Android 5.1 ( Api 22 )', api: 22},
    {label: 'Android 6.0 ( Api 23 )', api: 23},
    {label: 'Android 7.0 ( Api 24 )', api: 24},
    {label: 'Android 7.1 ( Api 25 )', api: 25},
    {label: 'Android 8.0.0 ( Api 26 )', api: 26},
    {label: 'Android 8.1.0 ( Api 27 )', api: 27},
    {label: 'Android 9 ( Api 28 )', api: 28},
    {label: 'Android 10 ( Api 29 )', api: 29},
    {label: 'Android 11 ( Api 30 )', api: 30}
];

class App extends React.Component {
    constructor(props) {
        super(props);
        this.theme = createTheme({
            palette: {
                primary: {
                    main: '#6200ee'
                }
            },
        });
        this.state = {
            userAnchorEl: undefined,
            userOpen: false,
            projectAnchorEl: undefined,
            projectOpen: false,
            buildAnchorEl: undefined,
            buildOpen: false,
            isLoading: true,
            snackbarMessage: undefined,
            projects: null,
            newProjectDialogOpen: false,
            newProjectDialogProjectName: '',
            newProjectDialogProjectPackageName: '',
            newProjectDialogProjectDescription: '',
            checkedProjects: [],
            currentProject: undefined,
            deleteProjectDialogOpen: false,
            importFileDialogOpen: false,
            fileSelected: undefined,
            fileSelectedName: "",
            fileSelectedDescription: "",
            buildingProject: false,
            projectBuiltDialogOpen: false,
            optionsDialogOpen: false,
            projectOptionsProjectName: undefined,
            projectOptionsProjectDescription: undefined,
            projectOptionsPackageName: undefined,
            projectOptionsVersionName: undefined,
            projectOptionsVersionNumber: undefined,
            projectOptionsHomeWebsite: undefined,
            projectOptionsMinSdk: undefined,
            userName: "",
            projectOptionsTabValue: "general",
            projectOptionsProguard: false,
            exportProjectDialogOpen: false,
            exportAsMultipleRadioChecked: false,
            exportAsZipRadioChecked: true,
            successSnackbarMessage: undefined,
            errorSnackbarMessage: undefined
        };
        this.setUserMenuAnchorEl = this.setUserMenuAnchorEl.bind(this);
        this.openUserMenu = this.openUserMenu.bind(this);
        this.handleUserMenuClose = this.handleUserMenuClose.bind(this);
        this.handleSignOutClose = this.handleSignOutClose.bind(this);
        this.setProjectMenuAnchorEl = this.setProjectMenuAnchorEl.bind(this);
        this.handleProjectMenuClose = this.handleProjectMenuClose.bind(this);
        this.openProjectMenu = this.openProjectMenu.bind(this);
        this.openBuildMenu = this.openBuildMenu.bind(this);
        this.handleBuildMenuClose = this.handleBuildMenuClose.bind(this);
        this.setBuildMenuAnchorEl = this.setBuildMenuAnchorEl.bind(this);
        this.handleNewProjectDialogClose = this.handleNewProjectDialogClose.bind(this);
        this.doCreateNewProject = this.doCreateNewProject.bind(this);
        this.setChecked = this.setChecked.bind(this);
        this.loadProjects = this.loadProjects.bind(this);
        this.doDeleteSelectedProjects = this.doDeleteSelectedProjects.bind(this);
        this.openProject = this.openProject.bind(this);
        this.handleMyProjectsMenuItem = this.handleMyProjectsMenuItem.bind(this);
        this.handleNewProjectMenuItem = this.handleNewProjectMenuItem.bind(this);
        this.handleBuildProjectMenuItem = this.handleBuildProjectMenuItem.bind(this);
        this.handleDeleteProjectMenuItem = this.handleDeleteProjectMenuItem.bind(this);
        this.handleCloseDeleteProjectDialog = this.handleCloseDeleteProjectDialog.bind(this);
        this.deleteProjects = this.deleteProjects.bind(this);
        this.handleExportProjectMenuItem = this.handleExportProjectMenuItem.bind(this);
        this.handleCloseImportFileDialog = this.handleCloseImportFileDialog.bind(this);
        this.openImportFileDialog = this.openImportFileDialog.bind(this);
        this.handleImportProjectMenuItem = this.handleImportProjectMenuItem.bind(this);
        this.processImportedFiles = this.processImportedFiles.bind(this);
        this.renderFileList = this.renderFileList.bind(this);
        this.handleSaveProjectMenuItem = this.handleSaveProjectMenuItem.bind(this);
        this.buildProject = this.buildProject.bind(this);
        this.handleCloseProjectBuiltDialog = this.handleCloseProjectBuiltDialog.bind(this);
        this.handleCloseProjectOptionsDialog = this.handleCloseProjectOptionsDialog.bind(this);
        this.handleProjectOptionsMenuItem = this.handleProjectOptionsMenuItem.bind(this);
        this.handleSaveProjectSettings = this.handleSaveProjectSettings.bind(this);
        this.projectSettingChanged = this.projectSettingChanged.bind(this);
        this.doExportSelectedProjects = this.doExportSelectedProjects.bind(this);
        this.handleChangeProjectOptionsTab = this.handleChangeProjectOptionsTab.bind(this);
        this.handleCloseExportProjectDialog = this.handleCloseExportProjectDialog.bind(this);
        this.openExportProjectDialog = this.openExportProjectDialog.bind(this);
        this.showSuccessSnackbar = this.showSuccessSnackbar.bind(this);
        this.showErrorSnackbar = this.showErrorSnackbar.bind(this);
        const firebaseConfig = {
            apiKey: "AIzaSyAJ_KkN5-XXJzdQni3Fkv1HyjnYHPJseaE",
            authDomain: "rapid-client.firebaseapp.com",
            projectId: "rapid-client",
            storageBucket: "rapid-client.appspot.com",
            messagingSenderId: "903527711453",
            appId: "1:903527711453:web:4685fdc673ff5b80481134",
            measurementId: "G-2R6PTZG4YS"
        };
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log(firebaseApp);
        const messaging = firebase.messaging(firebaseApp);
        messaging.onMessage(function (e) {
            console.log(e);
        });
        firebaseApp.auth().onAuthStateChanged((user) => {
            if (user) {
                user.getIdToken().then(function (value) {
                    console.log(value);
                });
                let data = this.state;
                data.isLoading = false;
                data.userName = user.displayName;
                this.setState(data);
                // resolve the user ID from the backend
                console.log(user);
                this.userManager = new UserManager(user);
                console.log("Resolving user id.");
                this.userManager.resolveUserID((success) => {
                    console.log(success);
                    if (success) {
                        console.log("Resolved user id");
                        this.userId = this.userManager.getUserId();
                        console.log(this.userId);
                        if (this.userId) {
                            user.getIdToken().then((token) => {
                                this.projectManager = new ProjectManager(this.userManager.getUser(), token);
                                this.loadProjects();
                            });
                        } else {
                            this.showErrorSnackbar("This user doesn't exist on our server.");
                        }
                    } else {
                        this.showErrorSnackbar("Failed to fetch the user information from the backend.");
                    }
                });
            } else {
                window.location.href = "auth?callback=" + window.location.href;
            }
        });
    }

    loadProjects() {
        this.projectManager.fetchProjects((success) => {
            if (success) {
                if (this.projectManager.getProjects()) {
                    console.log(this.projectManager.getProjects());
                    const data = this.state;
                    data.projects = this.projectManager.getProjects();
                    data.currentProject = undefined; // unload any existing project.
                    console.log(data);
                    console.log(this.projectToLoad);
                    this.setState(data, () => {
                        if (this.projectToLoad) {
                            this.openProject(this.projectToLoad);
                            this.projectToLoad = undefined;
                        }
                    });
                } else {
                    this.showErrorSnackbar("Failed to fetch the projects from the backend server.");
                }
            } else {
                this.showErrorSnackbar("Failed to fetch the projects from the backend server.");
            }
        });
    }

    handleToggle(event, value) {
        event.stopPropagation();
        const currentIndex = this.state.checkedProjects.indexOf(value);
        const newChecked = [...this.state.checkedProjects];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        this.setChecked(newChecked);
    }

    setChecked(newChecked) {
        let data = this.state;
        data.checkedProjects = newChecked;
        this.setState(data);
    }

    openUserMenu(event) {
        this.setUserMenuAnchorEl(event.currentTarget);
    }

    setUserMenuAnchorEl(value) {
        if (value) {
            const data = this.state;
            data.userAnchorEl = value;
            data.userOpen = true;
            this.setState(data);
        }
    }

    handleProjectMenuClose() {
        const data = this.state;
        data.projectAnchorEl = undefined;
        data.projectOpen = false;
        this.setState(data);
    }

    openProjectMenu(event) {
        this.setProjectMenuAnchorEl(event.currentTarget);
    }

    setProjectMenuAnchorEl(value) {
        if (value) {
            const data = this.state;
            data.projectAnchorEl = value;
            data.projectOpen = true;
            this.setState(data);
        }
    }

    handleUserMenuClose() {
        const data = this.state;
        data.userAnchorEl = undefined;
        data.userOpen = false;
        this.setState(data);
    }

    openBuildMenu(event) {
        this.setBuildMenuAnchorEl(event.currentTarget);
    }

    setBuildMenuAnchorEl(value) {
        if (value) {
            const data = this.state;
            data.buildAnchorEl = value;
            data.buildOpen = true;
            this.setState(data);
        }
    }

    handleBuildMenuClose() {
        const data = this.state;
        data.buildAnchorEl = undefined;
        data.buildOpen = false;
        this.setState(data);
    }

    handleSignOutClose() {
        firebaseApp.auth().signOut().then();
        this.handleUserMenuClose();
    }

    openNewProjectDialog() {
        const data = this.state;
        data.newProjectDialogOpen = true;
        this.setState(data);
    }

    handleCloseImportFileDialog() {
        const data = this.state;
        data.importFileDialogOpen = false;
        data.fileSelected = undefined;
        data.fileSelectedName = undefined;
        data.fileSelectedDescription = "";
        this.setState(data);
    }

    openImportFileDialog() {
        const data = this.state;
        data.importFileDialogOpen = true;
        this.setState(data);
    }

    handleCloseProjectOptionsDialog() {
        const data = this.state;
        data.optionsDialogOpen = false;
        this.setState(data);
    }

    openProjectOptionsDialog() {
        const data = this.state;
        data.optionsDialogOpen = true;
        data.projectOptionsProjectName = this.state.currentProject.name;
        data.projectOptionsProjectDescription = this.state.currentProject.description.replaceAll("<br>", "\n");
        data.projectOptionsPackageName = this.state.currentProject.packageName;
        data.projectOptionsVersionName = this.state.currentProject.versionName;
        data.projectOptionsVersionNumber = this.state.currentProject.versionNumber;
        data.projectOptionsMinSdk = this.getObjectByApi(this.state.currentProject.minSdk);
        console.log(this.state.currentProject);
        data.projectOptionsProguard = this.state.currentProject.proguard;
        this.setState(data);
    }

    renderUserMenu() {
        return (
            <Menu id="fade-menu" anchorEl={this.state.userAnchorEl}
                  anchorOrigin={{vertical: "bottom", horizontal: "center"}}
                  transformOrigin={{vertical: "top", horizontal: "center"}} open={this.state.userOpen}
                  onClose={this.handleUserMenuClose} autoFocus={false}>
                <MenuItem onClick={this.handleSignOutClose}>
                    <ListItemIcon>
                        <ExitToApp fontSize="small" style={{fill: "black"}}/>
                    </ListItemIcon>Log Out</MenuItem>
            </Menu>
        )
    }

    handleBuildProjectMenuItem() {
        this.handleBuildMenuClose();
        this.buildProject();
    }

    renderBuildMenu() {
        return (
            <Menu id="fade-menu" anchorEl={this.state.buildAnchorEl}
                  anchorOrigin={{vertical: "bottom", horizontal: "left"}}
                  transformOrigin={{vertical: "top", horizontal: "left"}} open={this.state.buildOpen}
                  onClose={this.handleBuildMenuClose}>
                <MenuItem onClick={this.handleBuildProjectMenuItem}>
                    <ListItemIcon>
                        <BugReport fontSize="medium" style={{fill: "black"}}/>
                    </ListItemIcon>Build Project ( Debug )</MenuItem>
                <MenuItem onClick={this.handleBuildProjectMenuItem}>
                    <ListItemIcon>
                        <NewReleases fontSize="medium" style={{fill: "black"}}/>
                    </ListItemIcon>Build Project ( Release )</MenuItem>
            </Menu>
        )
    }

    handleNewProjectMenuItem() {
        this.handleProjectMenuClose();
        this.openNewProjectDialog();
    }

    handleCloseDeleteProjectDialog(delete_) {
        let data = this.state;
        data.deleteProjectDialogOpen = false;
        this.setState(data);
        if (delete_) {
            const projectsToDelete = this.projectsToDelete;
            let project;
            for (let projectIndex in projectsToDelete) {
                project = projectsToDelete[projectIndex];
                this.projectManager.deleteProject(project, (success) => {
                    if (!success) {
                        this.showErrorSnackbar("Failed to delete project " + project.name);
                        return;
                    }
                    console.log(projectsToDelete.length);
                    console.log(projectIndex);
                    if (projectIndex >= (projectsToDelete.length - 1)) {
                        this.showSuccessSnackbar("Successfully deleted project.");
                        if (this.blocklyWorkspace) {
                            this.blocklyWorkspace.disposeBlocklyWorkspace();
                            this.blocklyWorkspace = null;
                        }
                        data = this.state;
                        data.projects = undefined;
                        data.checkedProjects = [];
                        data.currentProject = undefined;
                        this.setState(data);
                        this.loadProjects();
                    }
                });
            }
        }
    }

    deleteProjects(projects) {
        this.projectsToDelete = projects;
        // show delete projects dialog
        let data = this.state;
        data.deleteProjectDialogOpen = true;
        this.setState(data);
    }

    handleDeleteProjectMenuItem() {
        this.handleProjectMenuClose();
        this.deleteProjects([this.state.currentProject]);
    }

    handleExportProjectMenuItem() {
        this.handleProjectMenuClose();
        this.blocklyWorkspace.createProjectFile(this.state.currentProject, function (content, project) {
            console.log(content);
            saveAs(content, project['name'] + '.rbx');
        }, false);
    }

    doExportSelectedProjects(opt_force, opt_zip) {
        opt_force = opt_force || false;
        opt_zip = opt_zip || false;
        if (this.state.checkedProjects.length > 1) {
            if (!opt_force) {
                this.openExportProjectDialog();
            } else {
                const zip = new JSZip();
                for (let index in this.state.checkedProjects) {
                    const project = this.state.checkedProjects[index];
                    this.blocklyWorkspace = new BlocklyWorkspace(project, this.projectManager);
                    this.blocklyWorkspace.createProjectFile(project, (content, project) => {
                        console.log(content);
                        if (opt_zip) {
                            zip.file(`${project['name']}.rbx`, content);
                            console.log(parseInt(index));
                            console.log(this.state.checkedProjects.length);
                            if ((parseInt(index) + 1) === this.state.checkedProjects.length) {
                                zip.generateAsync({type: "blob"}).then((content) => {
                                    saveAs(content, 'projects.zip');
                                })
                            }
                        } else {
                            saveAs(content, `${project['name']}.rbx`);
                        }
                    }, false);
                    this.blocklyWorkspace.disposeBlocklyWorkspace();
                    this.blocklyWorkspace = null;
                }
            }
        }
    }

    openExportProjectDialog() {
        let data = this.state;
        data.exportProjectDialogOpen = true;
        data.exportAsMultipleRadioChecked = false;
        data.exportAsZipRadioChecked = true;
        this.setState(data);
    }

    handleImportProjectMenuItem() {
        this.handleProjectMenuClose();
        this.openImportFileDialog();
    }

    handleChangeProjectOptionsTab(event, value) {
        let data = this.state;
        data.projectOptionsTabValue = value;
        this.setState(data);
    }

    handleProjectOptionsMenuItem() {
        this.handleProjectMenuClose();
        this.openProjectOptionsDialog();
    }

    renderProjectMenu() {
        return (
            <Menu id="fade-menu" anchorEl={this.state.projectAnchorEl}
                  anchorOrigin={{vertical: "bottom", horizontal: "left"}}
                  transformOrigin={{vertical: "top", horizontal: "left"}} open={this.state.projectOpen}
                  onClose={this.handleProjectMenuClose}>
                <MenuItem onClick={this.handleMyProjectsMenuItem}>
                    <ListItemIcon>
                        <Folder fontSize="small" style={{fill: "black"}}/>
                    </ListItemIcon>My Projects</MenuItem>
                <Divider/>
                <MenuItem onClick={this.handleProjectOptionsMenuItem}>
                    <ListItemIcon>
                        <Settings fontSize="small" style={{fill: "black"}}/>
                    </ListItemIcon>Options</MenuItem>
                <Divider/>
                <MenuItem onClick={this.handleNewProjectMenuItem}>
                    <ListItemIcon>
                        <Add style={{fill: "black"}} fontSize="small"/>
                    </ListItemIcon>New Project</MenuItem>
                <MenuItem onClick={this.handleSaveProjectMenuItem}>
                    <ListItemIcon>
                        <Save fontSize="small" style={{fill: "black"}}/>
                    </ListItemIcon>Save Project</MenuItem>
                <MenuItem onClick={this.handleDeleteProjectMenuItem}>
                    <ListItemIcon>
                        <Delete style={{fill: "black"}} fontSize="small"/>
                    </ListItemIcon>Delete Project</MenuItem>
                <MenuItem onClick={this.handleImportProjectMenuItem}>
                    <ListItemIcon>
                        <Upload fontSize="small" style={{fill: "black"}}/>
                    </ListItemIcon>Import Project</MenuItem>
                <MenuItem onClick={this.handleExportProjectMenuItem}>
                    <ListItemIcon>
                        <Download fontSize="small" style={{fill: "black"}}/>
                    </ListItemIcon>Export Project</MenuItem>
            </Menu>
        )
    }

    render() {
        return (
            !this.state.isLoading ? (<ThemeProvider theme={this.theme}>
                <div className="App">
                    <div id="project-building-popup">
                        <CircularProgress/>
                        <p id="building-popup-label">Building Test..</p>
                    </div>
                    <table style={{width: "100%"}}>
                        <tbody>
                        <tr>
                            <td style={{width: "1px"}}>
                                <img src={logo} style={{width: "70px", height: "70px", marginTop: "10px"}}
                                     alt={"logo"}/>
                            </td>
                            <Dialog
                                open={this.state.importFileDialogOpen}
                                onClose={this.handleCloseImportFileDialog}
                                maxWidth={"md"}
                                aria-labelledby="alert-dialog-title"
                                aria-describedby="alert-dialog-description"
                            >
                                <DialogTitle id="alert-dialog-title">
                                    {"Import Project"}
                                </DialogTitle>
                                <DialogContent dividers style={{width: "645px", height: "250px"}}>
                                    <FileDrop
                                        onDrop={(files) => this.processImportedFiles(files)}>
                                        Drag & Drop Your .rbx file here
                                        <p style={{textAlign: "center"}}>Or</p>
                                        <input accept=".rbx" id="file-upload-btn" style={{display: "none"}}
                                               type="file" onChange={(e) => this.processImportedFiles(e.target.files)}/>
                                        <label htmlFor="file-upload-btn"
                                               style={{
                                                   textAlign: "center",
                                                   display: "block",
                                                   color: "#6200ee",
                                                   cursor: "pointer",
                                                   fontWeight: "bold"
                                               }}>Browse to upload</label>
                                    </FileDrop>
                                    <List sx={{marginTop: "55px", width: '100%', bgcolor: 'background.paper'}}>
                                        {this.renderFileList()}
                                    </List>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={this.handleCloseImportFileDialog}>Cancel</Button>
                                    <Button onClick={() => this.processImportedFiles(this.state.fileSelected, true)}
                                            autoFocus disabled={!this.state.fileSelected}>
                                        Import
                                    </Button>
                                </DialogActions>
                            </Dialog>
                            {this.renderProjectMenu()}
                            {this.renderBuildMenu()}
                            <td id="project-toolbar"
                                style={this.state.currentProject ? {visibility: "visible"} : {visibility: "hidden"}}>
                                <Button
                                    variant="outlined"
                                    id={"file-button"}
                                    className='toolbar-button'
                                    color={"primary"}
                                    onClick={this.openProjectMenu}>Project</Button>
                                <Button
                                    variant="outlined"
                                    id={"build-button"}
                                    className='toolbar-button'
                                    color={"primary"}
                                    onClick={this.openBuildMenu}>Build</Button>
                            </td>
                            <td style={{float: "right"}}>
                                {this.renderUserMenu()}
                                <Avatar sx={{width: 48, height: 48, bgcolor: "#6200ee"}}
                                        style={{marginBottom: "10px", marginTop: "24px", marginRight: "10px"}}
                                        onClick={this.openUserMenu}>{this.state.userName.charAt(0)}</Avatar>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <div
                        style={(!this.state.checkedProjects || this.state.checkedProjects.length === 0) && !this.state.currentProject && this.projectManager ? {
                            display: 'flex',
                            alignItems: 'center',
                            margin: "10px"
                        } : {display: 'none'}} id={"projectsControls"}>
                        <Button variant="outlined" className='toolbar-button'
                                onClick={() => this.openNewProjectDialog()}
                                id={'project-controls-new-project-button'} color={"primary"} startIcon={<Add/>}> New
                            Project</Button>
                        <Button onClick={this.openImportFileDialog} variant="outlined" className='toolbar-button'
                                id={'project-controls-import-project-button'} color={"primary"}
                                startIcon={<Backup/>}> Import
                            Project</Button>
                    </div>
                    <div
                        style={(!this.state.checkedProjects || this.state.checkedProjects.length === 0 || this.state.currentProject) ? {display: 'none'} : {
                            display: 'flex',
                            alignItems: 'center',
                            margin: "10px"
                        }} id={"selectedProjectsControls"}>
                        <Button variant="outlined" className='toolbar-button'
                                onClick={() => this.doDeleteSelectedProjects()}
                                id={'selected-project-controls-delete-project-button'} color={"primary"}
                                startIcon={<Delete/>}> Delete Project</Button>
                        <Button onClick={() => this.doExportSelectedProjects()} variant="outlined"
                                className='toolbar-button'
                                id={'selected-project-controls-export-project-button'} color={"primary"}
                                startIcon={<Download/>}> Export Project</Button>
                    </div>
                    {this.renderProjectsView()}
                    <table id={"project-view-table"}
                           style={this.state.currentProject ? {display: 'table'} : {display: 'none'}}>
                        <tbody>
                        <tr id={"project-view-tr"}>
                            <td id={"project-view"} style={{position: "absolute", height: "84vh", width: "99%"}}>
                                {/*The blockly workspace is injected here at runtime*/}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <Dialog
                        open={this.state.newProjectDialogOpen}
                        onClose={this.handleNewProjectDialogClose}
                        aria-labelledby="responsive-dialog-title"
                    >
                        <DialogTitle id="responsive-dialog-title">
                            {"Create New Project"}
                        </DialogTitle>
                        <DialogContent dividers>
                            <TextField fullWidth onChange={(e) => {
                                const data = this.state;
                                data.newProjectDialogProjectName = e.target.value;
                                this.setState(data);
                            }}
                                       value={this.state.newProjectDialogProjectName}
                                       InputProps={{
                                           endAdornment: <InputAdornment position="end">
                                               <Tooltip title="Generate Project Name">
                                                   <IconButton onClick={() => {
                                                       const rawProjectName = generate().raw;
                                                       // convert the row project name into UpperCamelCase
                                                       let finalProjectName = "";
                                                       for (let index in rawProjectName) {
                                                           finalProjectName += rawProjectName[index].charAt(0).toUpperCase() + rawProjectName[index].substring(1, rawProjectName[index].length);
                                                       }
                                                       const data = this.state;
                                                       data.newProjectDialogProjectName = finalProjectName;
                                                       this.setState(data);
                                                   }} edge="end"><AutoAwesome/></IconButton>
                                               </Tooltip>
                                           </InputAdornment>
                                       }}
                                       error={this.state.newProjectDialogProjectName.length > 0 && !this.isClassNameValid(this.state.newProjectDialogProjectName)}
                                       required label="Name" variant="outlined"
                                       helperText={"The project's name. Must be in UpperCamelCase to match appinventor extension name conventions."}
                                       style={{marginTop: "10px", marginBottom: "20px"}}/>
                            <Divider/>
                            <TextField onChange={(e) => {
                                const data = this.state;
                                data.newProjectDialogProjectPackageName = e.target.value;
                                this.setState(data);
                            }} fullWidth required label="Package Name" variant="outlined"
                                       helperText={"The project's package name. Must be in UpperCamelCase to match appinventor extension name conventions."}
                                       style={{marginTop: "20px", marginBottom: "20px"}}/>
                            <Divider/>
                            <TextField onChange={(e) => {
                                const data = this.state;
                                data.newProjectDialogProjectDescription = e.target.value;
                                this.setState(data);
                            }} fullWidth multiline label="Project Description" variant="outlined"
                                       helperText={"The project's description. Shown in the extension's info. Supports HTML."}
                                       style={{marginTop: "20px"}}/>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleNewProjectDialogClose}>
                                Cancel
                            </Button>
                            <Button onClick={this.doCreateNewProject}>
                                Create
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={this.state.deleteProjectDialogOpen}
                        onClose={() => this.handleCloseDeleteProjectDialog(false)}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Delete Project(s)?"}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                Deleted projects are irrecoverable. Take this action with caution, and make sure to take
                                a backup beforehand.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => this.handleCloseDeleteProjectDialog(false)}>Cancel</Button>
                            <Button onClick={() => this.handleCloseDeleteProjectDialog(true)} autoFocus>
                                Confirm
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={this.state.exportProjectDialogOpen}
                        onClose={() => this.handleCloseExportProjectDialog(false)}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Export Projects?"}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                You are exporting multiple projects. Please select how do you want to export them.
                            </DialogContentText>
                            <FormControl component="fieldset">
                                <RadioGroup row aria-label="gender" name="row-radio-buttons-group">
                                    <FormControlLabel value="zip" control={<Radio checked={this.state.exportAsZipRadioChecked} onChange={(e) => {
                                        let data = this.state;
                                        data.exportAsZipRadioChecked = e.target.checked;
                                        data.exportAsMultipleRadioChecked = false;
                                        this.setState(data);
                                    }}/>} label="Export As Zip File ( Recommended )"/>
                                    <FormControlLabel value="multiple" control={<Radio checked={this.state.exportAsMultipleRadioChecked} onChange={(e) => {
                                        let data = this.state;
                                        data.exportAsMultipleRadioChecked = e.target.checked;
                                        data.exportAsZipRadioChecked = false;
                                        this.setState(data);
                                    }}/>}
                                                      label="Export As Multiple Files ( Could Be Blocked By the Browser )"/>
                                </RadioGroup>
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => this.handleCloseExportProjectDialog(false)}>Cancel</Button>
                            <Button onClick={() => this.handleCloseExportProjectDialog(true)} autoFocus>
                                Export
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={this.state.optionsDialogOpen}
                        onClose={this.handleCloseProjectOptionsDialog}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Project Settings"}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{width: '100%'}}>
                                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                                    <Tabs value={this.state.projectOptionsTabValue} variant={"fullWidth"}
                                          indicatorColor="primary"
                                          textColor="primary" onChange={this.handleChangeProjectOptionsTab}>
                                        <Tab value={"general"}
                                             label={<div><Extension style={{verticalAlign: 'middle'}}/> General
                                             </div>}/>
                                        <Tab value={"publishing"}
                                             label={<div><Publish style={{verticalAlign: 'middle'}}/> Publishing
                                             </div>}/>
                                    </Tabs>
                                </Box>
                            </Box>
                            <TabPanel index={"general"} value={this.state.projectOptionsTabValue}>
                                <TextField onChange={(e) => {
                                    let data = this.state;
                                    data.projectOptionsProjectName = e.target.value || "";
                                    this.setState(data);
                                }}
                                           error={this.state.projectOptionsProjectName !== undefined ? (this.state.projectOptionsProjectName.length > 0 && !this.isClassNameValid(this.state.projectOptionsProjectName)) : false}
                                           fullWidth variant={"outlined"} label={"Name"}
                                           value={this.state.projectOptionsProjectName !== undefined ? this.state.projectOptionsProjectName : ""}
                                           helperText={"The project name. Must Be In UpperCamelCase to follow the appinventor naming conventions for extensions."}/>
                                <Divider style={{marginTop: "10px", marginBottom: "20px"}}/>
                                <TextField onChange={(e) => {
                                    let data = this.state;
                                    data.projectOptionsPackageName = e.target.value || "";
                                    this.setState(data);
                                }}
                                           error={this.state.projectOptionsPackageName !== undefined ? (this.state.projectOptionsPackageName.length > 0 && !this.isPackageNameValid(this.state.projectOptionsPackageName)) : false}
                                           fullWidth variant={"outlined"} label={"Package Name"}
                                           value={this.state.projectOptionsPackageName !== undefined ? this.state.projectOptionsPackageName : ""}
                                           helperText={"The project's package name. Must follow the java package naming conventions. NOTE: Changing the package name of existing extensions will cause App Inventor to NOT upgrade it when imported to older projects using the extension."}/>
                                <Divider style={{marginTop: "10px", marginBottom: "20px"}}/>
                                <TextField onChange={(e) => {
                                    let data = this.state;
                                    data.projectOptionsProjectDescription = e.target.value;
                                    this.setState(data);
                                }} fullWidth multiline variant={"outlined"} label={"Description"}
                                           value={typeof this.state.projectOptionsProjectDescription === 'string' ? this.state.projectOptionsProjectDescription : ""}
                                           helperText={"The project description. Shown in the extension info when imported. Supports HTML."}/>
                                <Divider style={{marginTop: "10px", marginBottom: "20px"}}/>
                                <TextField onChange={(e) => {
                                    let data = this.state;
                                    data.projectOptionsVersionName = e.target.value || "";
                                    this.setState(data);
                                }}
                                           fullWidth variant={"outlined"} label={"Version Name"}
                                           value={this.state.projectOptionsVersionName !== undefined ? this.state.projectOptionsVersionName : ""}
                                           helperText={"The project's version name. An example for version names are: 1.5, v14.3, v0.2-beta."}/>
                                <Divider style={{marginTop: "10px", marginBottom: "20px"}}/>
                                <TextField onChange={(e) => {
                                    let data = this.state;
                                    data.projectOptionsVersionNumber = e.target.value || "";
                                    this.setState(data);
                                }}
                                           type={"number"}
                                           fullWidth variant={"outlined"} label={"Version Number"}
                                           value={this.state.projectOptionsVersionNumber !== undefined ? this.state.projectOptionsVersionNumber : ""}
                                           helperText={"The project's version number. Increment it with every release build."}/>
                                <Divider style={{marginTop: "10px", marginBottom: "20px"}}/>
                                <TextField onChange={(e) => {
                                    let data = this.state;
                                    data.projectOptionsHomeWebsite = e.target.value || "";
                                    this.setState(data);
                                }}
                                           error={this.state.projectOptionsHomeWebsite && this.state.projectOptionsHomeWebsite.length !== 0 && !this.isValidUrl(this.state.projectOptionsHomeWebsite)}
                                           fullWidth variant={"outlined"} label={"Home Website"}
                                           value={this.state.projectOptionsHomeWebsite !== undefined ? this.state.projectOptionsHomeWebsite : ""}
                                           helperText={"The project's homepage url."}/>
                                <Divider style={{marginTop: "10px", marginBottom: "20px"}}/>
                                <Autocomplete
                                    disablePortal
                                    options={androidSdks}
                                    fullWidth
                                    value={this.state.projectOptionsMinSdk ? this.state.projectOptionsMinSdk.label : androidSdks[0]}
                                    onChange={(e, newValue) => {
                                        if (newValue) {
                                            let data = this.state;
                                            data.projectOptionsMinSdk = newValue;
                                            this.setState(data);
                                        }
                                    }}
                                    renderInput={(params) => <TextField
                                        helperText={"The project's Min API value. The default value is 7. App Inventor distributions could override the min API if their apps defaults to a higher min SDK. which has modified the projects min. sdk, or allow the user to modify it."} {...params}
                                        label="Min SDK"/>}
                                />
                            </TabPanel>
                            <TabPanel index={"publishing"} value={this.state.projectOptionsTabValue}>
                                <FormControl fullWidth>
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={this.state.projectOptionsProguard}
                                                                           onChange={(e) => {
                                                                               console.log(this.state.projectOptionsProguard);
                                                                               let data = this.state;
                                                                               data.projectOptionsProguard = e.target.checked;
                                                                               this.setState(data);
                                                                           }}/>} label="Proguard Extension"/>
                                        <FormHelperText>Obfuscates and optimizes the source code for the output
                                            extension.</FormHelperText>
                                    </FormGroup>
                                </FormControl>
                            </TabPanel>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleCloseProjectOptionsDialog}>Cancel</Button>
                            <Button onClick={this.handleSaveProjectSettings} autoFocus>
                                Save
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <xml id="toolbox" style={{display: "none"}}>
                        <category colour="210" id="catLogic" name="Logic">
                            <block type="controls_if"/>
                            <block type="logic_compare"/>
                            <block type="logic_operation"/>
                            <block type="logic_negate"/>
                            <block type="logic_boolean"/>
                            <block type="logic_null"/>
                            <block type="logic_ternary"/>
                        </category>
                        <category colour="120" id="catLoops" name="Loops">
                            <block type="controls_repeat_ext">
                                <value name="TIMES">
                                    <shadow type="math_number">
                                        <field name="NUM">10</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="controls_whileUntil"/>
                            <block type="controls_for">
                                <value name="FROM">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                                <value name="TO">
                                    <shadow type="math_number">
                                        <field name="NUM">10</field>
                                    </shadow>
                                </value>
                                <value name="BY">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="controls_forEach"/>
                            <block type="controls_flow_statements"/>
                        </category>
                        <category colour="230" id="catMath" name="Math">
                            <block type="math_number"/>
                            <block type="math_arithmetic">
                                <value name="A">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                                <value name="B">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_single">
                                <value name="NUM">
                                    <shadow type="math_number">
                                        <field name="NUM">9</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_trig">
                                <value name="NUM">
                                    <shadow type="math_number">
                                        <field name="NUM">45</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_constant"/>
                            <block type="math_number_property">
                                <value name="NUMBER_TO_CHECK">
                                    <shadow type="math_number">
                                        <field name="NUM">0</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_change">
                                <value name="DELTA">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_round">
                                <value name="NUM">
                                    <shadow type="math_number">
                                        <field name="NUM">3.1</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_on_list"/>
                            <block type="math_modulo">
                                <value name="DIVIDEND">
                                    <shadow type="math_number">
                                        <field name="NUM">64</field>
                                    </shadow>
                                </value>
                                <value name="DIVISOR">
                                    <shadow type="math_number">
                                        <field name="NUM">10</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_constrain">
                                <value name="VALUE">
                                    <shadow type="math_number">
                                        <field name="NUM">50</field>
                                    </shadow>
                                </value>
                                <value name="LOW">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                                <value name="HIGH">
                                    <shadow type="math_number">
                                        <field name="NUM">100</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_random_int">
                                <value name="FROM">
                                    <shadow type="math_number">
                                        <field name="NUM">1</field>
                                    </shadow>
                                </value>
                                <value name="TO">
                                    <shadow type="math_number">
                                        <field name="NUM">100</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="math_random_float"/>
                        </category>
                        <category colour="160" id="catText" name="Text">
                            <block type="text"/>
                            <block type="text_join"/>
                            <block type="text_append">
                                <value name="TEXT">
                                    <shadow type="text"/>
                                </value>
                            </block>
                            <block type="text_length">
                                <value name="VALUE">
                                    <shadow type="text">
                                        <field name="TEXT">abc</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="text_isEmpty">
                                <value name="VALUE">
                                    <shadow type="text">
                                        <field name="TEXT"/>
                                    </shadow>
                                </value>
                            </block>
                            <block type="text_indexOf">
                                <value name="VALUE">
                                    <block type="variables_get">
                                        <field name="VAR">text</field>
                                    </block>
                                </value>
                                <value name="FIND">
                                    <shadow type="text">
                                        <field name="TEXT">abc</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="text_charAt">
                                <value name="VALUE">
                                    <block type="variables_get">
                                        <field name="VAR">text</field>
                                    </block>
                                </value>
                            </block>
                            <block type="text_getSubstring">
                                <value name="STRING">
                                    <block type="variables_get">
                                        <field name="VAR">text</field>
                                    </block>
                                </value>
                            </block>
                            <block type="text_changeCase">
                                <value name="TEXT">
                                    <shadow type="text">
                                        <field name="TEXT">abc</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="text_trim">
                                <value name="TEXT">
                                    <shadow type="text">
                                        <field name="TEXT">abc</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="text_print">
                                <value name="TEXT">
                                    <shadow type="text">
                                        <field name="TEXT">abc</field>
                                    </shadow>
                                </value>
                            </block>
                        </category>
                        <category colour="260" id="catLists" name="Lists">
                            <block type="lists_create_with">
                                <mutation items="0"/>
                            </block>
                            <block type="lists_create_with"/>
                            <block type="lists_repeat">
                                <value name="NUM">
                                    <shadow type="math_number">
                                        <field name="NUM">5</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="lists_length"/>
                            <block type="lists_isEmpty"/>
                            <block type="lists_indexOf">
                                <value name="VALUE">
                                    <block type="variables_get">
                                        <field name="VAR">list</field>
                                    </block>
                                </value>
                            </block>
                            <block type="lists_getIndex">
                                <value name="VALUE">
                                    <block type="variables_get">
                                        <field name="VAR">list</field>
                                    </block>
                                </value>
                            </block>
                            <block type="lists_setIndex">
                                <value name="LIST">
                                    <block type="variables_get">
                                        <field name="VAR">list</field>
                                    </block>
                                </value>
                            </block>
                            <block type="lists_getSublist">
                                <value name="LIST">
                                    <block type="variables_get">
                                        <field name="VAR">list</field>
                                    </block>
                                </value>
                            </block>
                            <block type="lists_split">
                                <value name="DELIM">
                                    <shadow type="text">
                                        <field name="TEXT">,</field>
                                    </shadow>
                                </value>
                            </block>
                        </category>
                        <category colour="20" id="catColour" name="Colors">
                            <block type="colour_picker"/>
                            <block type="colour_random"/>
                            <block type="colour_rgb">
                                <value name="RED">
                                    <shadow type="math_number">
                                        <field name="NUM">100</field>
                                    </shadow>
                                </value>
                                <value name="GREEN">
                                    <shadow type="math_number">
                                        <field name="NUM">50</field>
                                    </shadow>
                                </value>
                                <value name="BLUE">
                                    <shadow type="math_number">
                                        <field name="NUM">0</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="colour_blend">
                                <value name="COLOUR1">
                                    <shadow type="colour_picker">
                                        <field name="COLOUR">#ff0000</field>
                                    </shadow>
                                </value>
                                <value name="COLOUR2">
                                    <shadow type="colour_picker">
                                        <field name="COLOUR">#3333ff</field>
                                    </shadow>
                                </value>
                                <value name="RATIO">
                                    <shadow type="math_number">
                                        <field name="NUM">0.5</field>
                                    </shadow>
                                </value>
                            </block>
                            <block type="colour_hex_to_decimal">
                                <value name="HEX">
                                    <shadow type="colour_picker">
                                        <field name="COLOUR">#ff0000</field>
                                    </shadow>
                                </value>
                            </block>
                        </category>
                        <sep/>
                        <category colour="330" custom="VARIABLE" id="catVariables" name="Variables"/>
                        <category colour="290" id="catFunctions" name="Procedures">
                            <block type="procedures_defnoreturn">
                                <field name="NAME">myFunction</field>
                            </block>
                            <block type="procedures_defreturn">
                                <field name="NAME">myFunction</field>
                            </block>
                            <block type="procedures_deffunctionnoreturn">
                                <field name="NAME">MyFunction</field>
                            </block>
                            <block type="procedures_deffunctionreturn">
                                <field name="NAME">MyFunction</field>
                            </block>
                        </category>
                    </xml>
                </div>
                <Portal>
                    <Snackbar onClose={() => this.showSnackbar(undefined)}
                              open={this.state.snackbarMessage}
                              autoHideDuration={3000}
                              message={this.state.snackbarMessage ? this.state.snackbarMessage : ""}/>
                </Portal>
                <Portal>
                    <Snackbar onClose={() => this.showSuccessSnackbar(undefined)}
                              open={this.state.successSnackbarMessage}
                              autoHideDuration={3000}>
                        <Alert onClose={() => this.showSuccessSnackbar(undefined)} severity="success" variant={"filled"} sx={{ width: '100%' }}>
                            {this.state.successSnackbarMessage ? this.state.successSnackbarMessage : ""}
                        </Alert>
                    </Snackbar>
                </Portal>
                <Portal>
                    <Snackbar onClose={() => this.showErrorSnackbar(undefined)}
                              open={this.state.errorSnackbarMessage}
                              autoHideDuration={3000}>
                        <Alert onClose={() => this.showErrorSnackbar(undefined)} severity="error" variant={"filled"} sx={{ width: '100%' }}>
                            {this.state.errorSnackbarMessage ? this.state.errorSnackbarMessage : ""}
                        </Alert>
                    </Snackbar>
                </Portal>
                <Backdrop
                    sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                    open={this.state.buildingProject}>
                    <div style={{textAlign: 'center'}}>
                        <CircularProgress color="inherit"/>
                        <p>Building Project..</p>
                    </div>
                </Backdrop>
                <Dialog
                    open={this.state.projectBuiltDialogOpen}
                    onClose={this.handleCloseProjectBuiltDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        {"Project Built Successfully"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <DialogContentText id="alert-dialog-description">
                            The project download link is only available for 10 minutes. You will not be able to use it
                            afterwards!
                        </DialogContentText>
                        <div style={{textAlign: "center"}}>
                            <QRCode value={this.projectDownloadLink} size={150}/>
                        </div>
                        <div style={{textAlign: "center"}}>
                            <Button href={this.projectDownloadLink} style={{width: "240px", marginTop: "20px"}}
                                    startIcon={<Download/>} variant={"outlined"}>Download Extension</Button>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseProjectBuiltDialog}>OK</Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>) : (<ThemeProvider theme={this.theme}>
                <div className={"centered-progress"}><CircularProgress/></div>
            </ThemeProvider>)
        );
    }

    handleCloseProjectBuiltDialog() {
        let data = this.state;
        data.projectBuiltDialogOpen = false;
        this.setState(data);
    }

    renderFileList() {
        if (this.state.fileSelected) {
            return (<ListItem>
                <ListItemAvatar>
                    <Avatar>
                        <Folder/>
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={this.state.fileSelectedName}
                    secondary={this.state.fileSelectedDescription}/>
            </ListItem>);
        } else {
            return (<div><p style={{textAlign: "center", opacity: "0.7"}}>Selected Projects Appears Here..</p></div>);
        }
    }

    showSnackbar(message) {
        const data = this.state;
        data.snackbarMessage = message;
        this.setState(data);
    }

    handleNewProjectDialogClose() {
        const data = this.state;
        data.newProjectDialogOpen = false;
        this.setState(data);
    }

    doCreateNewProject() {
        // validate inputs
        if (!this.state.newProjectDialogProjectName || this.state.newProjectDialogProjectName.length === 0) {
            this.showErrorSnackbar("Please enter a name for your project.");
            return;
        }
        if (!this.isClassNameValid(this.state.newProjectDialogProjectName)) {
            this.showErrorSnackbar("Project Name is is an invalid java class name.");
            return;
        }
        if (!this.state.newProjectDialogProjectPackageName || this.state.newProjectDialogProjectPackageName.length === 0) {
            this.showErrorSnackbar("Please enter a package name for your project.");
            return;
        }
        if (!this.isPackageNameValid(this.state.newProjectDialogProjectPackageName)) {
            this.showErrorSnackbar("Package Name is is an invalid java package name.");
            return;
        }
        this.projectManager.newProject({
            name: this.state.newProjectDialogProjectName,
            packageName: this.state.newProjectDialogProjectPackageName,
            description: this.state.newProjectDialogProjectDescription.replaceAll("\n", "<br>") || '',
        }, (statusCode, project) => {
            if (statusCode === 200) {
                console.log(project);
                this.projectToLoad = project;
                this.loadProjects();
                let data = this.state;
                data.projects = undefined;
                data.newProjectDialogProjectName = "";
                data.newProjectDialogProjectDescription = "";
                data.newProjectDialogProjectPackageName = "";
                this.setState(data);
            } else if (statusCode === 409) {
                this.showErrorSnackbar("A project with the same name already exists.");
            } else if (statusCode === 401) {
                this.showErrorSnackbar("Your session has expired. Please reload the webpage and try again.");
            } else {
                this.showErrorSnackbar("The server encountered an error while creating your project. Status Code: " + statusCode);
            }
        });
        this.handleNewProjectDialogClose();
    }

    doDeleteSelectedProjects() {
        this.deleteProjects(this.state.checkedProjects);
    }

    displayListView() {
        return <tr id={"projects-list"} style={this.state.projects && this.state.projects.length !== 0 ?
            {display: "table-row", verticalAlign: "top"} : {display: "none"}}>
            <td style={{textAlign: "center"}}>
                <Box sx={{bgcolor: 'background.paper'}} style={{overflow: "scroll", height: "70vh"}}>
                    <nav>
                        <List>
                            {this.state.projects.map((project) =>
                                <div>
                                    <ListItem>
                                        <ListItemButton disableRipple={this.state.checkedProjects.length > 0} onClick={() => {
                                            if (!(this.state.checkedProjects.length > 0)) {
                                                this.openProject(project)
                                            }
                                        }}
                                                        style={{height: "61px", borderRadius: "5px"}} dense>
                                            <ListItemIcon>
                                                <Checkbox
                                                    onClick={(e) => this.handleToggle(e, project)}
                                                    edge="start"
                                                    checked={this.state.checkedProjects.indexOf(project) !== -1}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={project.name}
                                                          secondary={project.description ? project.description : ""}/>
                                        </ListItemButton>
                                    </ListItem>
                                    <Divider variant="middle"/>
                                </div>
                            )}
                        </List>
                    </nav>
                </Box>
            </td>
        </tr>
    }

    openProject(project) {
        // unload previous workspace
        if (this.blocklyWorkspace) {
            this.blocklyWorkspace.disposeBlocklyWorkspace();
            this.blocklyWorkspace = null;
        }
        let data = this.state;
        data.currentProject = project;
        console.log(project);
        this.blocklyWorkspace = new BlocklyWorkspace(project, this.projectManager);
        console.log(data);
        this.setState(data, this.blocklyWorkspace.injectBlocklyWorkspace);
    }

    handleMyProjectsMenuItem() {
        this.handleProjectMenuClose();
        let data = this.state;
        data.currentProject = undefined;
        this.setState(data, () => {
            if (this.blocklyWorkspace) {
                this.blocklyWorkspace.disposeBlocklyWorkspace();
                this.blocklyWorkspace = null;
            }
        });
    }

    processImportedFiles(files, import_) {
        console.log(files);
        const file = files instanceof FileList ? files[0] : files; // we currently only support one file per every import
        console.log(this.getFileExtension(file.name));
        if (this.getFileExtension(file.name) !== "rbx") {
            this.showErrorSnackbar("This file isn't a project file. Project files are .rbx files.");
        } else {
            JSZip.loadAsync(file).then((content) => {
                // if you return a promise in a "then", you will chain the two promises
                return content.files["extension.json"].async('text');
            }).then((extensionJsonContent) => {
                const extensionJson = JSON.parse(extensionJsonContent);
                if (!import_) {
                    console.log(extensionJsonContent);
                    const description = extensionJson.description ? extensionJson.description : "";
                    let data = this.state;
                    data.fileSelected = file;
                    data.fileSelectedName = extensionJson.name;
                    data.fileSelectedDescription = description;
                    this.setState(data);
                } else {
                    console.log("Json content: " + extensionJsonContent);
                    console.log("Json ", extensionJson);
                    this.projectManager.newProject(extensionJson, (statusCode, project) => {
                        if (statusCode === 200) {
                            this.projectToLoad = project;
                            this.loadProjects();
                            let data = this.state;
                            data.projects = undefined;
                            this.setState(data);
                        } else if (statusCode === 409) {
                            this.showErrorSnackbar("A project with the same name already exists.");
                        } else {
                            this.showErrorSnackbar("The server encountered an error while creating your project. Status Code: " + statusCode);
                        }
                    });
                    this.handleCloseImportFileDialog();
                }
            });
        }
    }

    getFileExtension(filename) {
        const ext = /^.+\.([^.]+)$/.exec(filename);
        return ext == null ? "" : ext[1];
    }

    handleSaveProjectMenuItem() {
        this.handleProjectMenuClose();
        if (this.projectManager) {
            this.projectManager.updateProject(this.state.currentProject, (success) => {
                if (success) {
                    const currentDate = new Date();
                    this.showSuccessSnackbar("Project saved at " + currentDate.getDate() + "/"
                        + (currentDate.getMonth() + 1) + "/"
                        + currentDate.getFullYear() + " "
                        + currentDate.getHours() + ":"
                        + currentDate.getMinutes() + ":"
                        + currentDate.getSeconds());
                } else {
                    this.showErrorSnackbar("Failed to save project.");
                }
            })
        }
    }

    buildProject() {
        let data = this.state;
        data.buildingProject = true;
        this.setState(data);
        this.blocklyWorkspace.createProjectFile(this.state.currentProject, (content, project) => {
            const fd = new FormData();
            fd.append('input', content);
            $.ajax({
                type: 'POST',
                url: BUILD_SERVER_URL + '/build',
                data: fd,
                timeout: 15000,
                processData: false,
                contentType: false
            }).done((data) => {

                const json = JSON.parse(data);
                const success = json['success'];
                this.projectDownloadLink = json['downloadUrl'];
                let newState = this.state;
                newState.buildingProject = false;
                newState.projectBuiltDialogOpen = true;
                this.setState(newState);
                console.log(data);
            }).fail(() => {
                let newState = this.state;
                newState.buildingProject = false;
                this.setState(newState);
                this.showErrorSnackbar("The BuildServer is temporarily down.");
            });
        });
    }

    isPackageNameValid(packageName) {
        return (/(^(?:[a-z_]+(?:\d*[a-zA-Z_]*)*)(?:\.[a-z_]+(?:\d*[a-zA-Z_]*)*)*$)/).test(packageName);
    }

    isClassNameValid(className) {
        return (!(/^\d/).test(className) && (/^[A-Z][A-Za-z]*$/).test(className));
    }

    handleSaveProjectSettings() {
        let newProject = this.state.currentProject;
        let newName = this.state.projectOptionsProjectName;
        if (newName && this.projectSettingChanged("name", newName)) {
            if (newName.trim().length === 0 || !this.isClassNameValid(newName)) {
                this.showErrorSnackbar("Invalid Project Name.");
                return;
            }
            newProject.name = newName;
        }
        let newDescription = this.state.projectOptionsProjectDescription;
        if (newDescription !== undefined && this.projectSettingChanged("description", newDescription)) {
            newProject.description = newDescription.replaceAll("\n", "<br>");
        }
        let newPackageName = this.state.projectOptionsPackageName;
        if (newPackageName && this.projectSettingChanged("packageName", newPackageName)) {
            if (newPackageName.trim().length === 0 || !this.isPackageNameValid(newPackageName)) {
                this.showErrorSnackbar("Invalid Package Name.");
                return;
            }
            newProject.packageName = newPackageName;
        }
        let newVersionName = this.state.projectOptionsVersionName;
        if (newVersionName && this.projectSettingChanged("versionName", newVersionName)) {
            newProject.versionName = newVersionName;
        }
        let newVersionNumber = this.state.projectOptionsVersionNumber;
        if (newVersionNumber && this.projectSettingChanged("versionNumber", newVersionNumber)) {
            if (newVersionNumber.trim().length === 0 || !/^\d+$/.test(newVersionNumber)) {
                this.showErrorSnackbar("Invalid Version Number.");
                return;
            }
            newProject.versionNumber = newVersionNumber;
        }
        let newHomePageWebsite = this.state.projectOptionsHomeWebsite;
        if (newHomePageWebsite && this.projectSettingChanged("homeWebsite", newHomePageWebsite)) {
            if (!this.isValidUrl(newHomePageWebsite)) {
                this.showErrorSnackbar("Invalid Home Website.");
                return;
            }
            newProject.homeWebsite = newHomePageWebsite;
        }
        let newMinSdk = this.state.projectOptionsMinSdk;
        if (newMinSdk && this.projectSettingChanged("minSdk", newMinSdk)) {
            newProject.minSdk = newMinSdk.api;
        }
        let newProguard = this.state.projectOptionsProguard;
        console.log(newProguard);
        if (newProguard !== undefined && this.projectSettingChanged("proguard", newProguard)) {
            newProject.proguard = newProguard;
        }
        if (newProject) {
            this.projectManager.updateProject(newProject, (status) => {
                console.log(status);
                if (status === 200) {
                    let data = this.state;
                    data.currentProject = newProject;
                    // so we don't use this value in the future.
                    data.projectOptionsProjectName = newProject.name;
                    data.projectOptionsProjectDescription = newProject.description;
                    data.projectOptionsPackageName = newProject.packageName;
                    data.projectOptionsVersionName = newProject.versionName;
                    data.projectOptionsVersionNumber = newProject.versionNumber;
                    data.projectOptionsHomeWebsite = newProject.homeWebsite;
                    data.projectOptionsMinSdk = this.getObjectByApi(newProject.minSdk);
                    data.projectOptionsProguard = newProject.proguard;
                    this.setState(data, () => {
                        this.showSuccessSnackbar("Project Settings Updated.");
                        this.handleCloseProjectOptionsDialog();
                    });
                } else {
                    let data = this.state;
                    data.projectOptionsProjectName = this.state.currentProject.name;
                    data.projectOptionsProjectDescription = this.state.currentProject.description;
                    data.projectOptionsPackageName = this.state.currentProject.packageName;
                    data.projectOptionsVersionName = this.state.currentProject.versionName;
                    data.projectOptionsVersionNumber = this.state.currentProject.versionNumber;
                    data.projectOptionsHomeWebsite = this.state.currentProject.homeWebsite;
                    data.projectOptionsMinSdk = this.getObjectByApi(this.state.currentProject.minSdk);
                    data.projectOptionsProguard = this.state.currentProject.proguard;
                    this.setState(data, () => {
                        if (status === 409) {
                            this.showErrorSnackbar("A project with the same name already exists.");
                        } else if (status === 401) {
                            this.showErrorSnackbar("Your session has expired. Please reload the webpage and try again.");
                        } else {
                            this.showErrorSnackbar("Failed to update settings.");
                        }
                    });
                }
            });
        }
    }

    projectSettingChanged(settingName, value) {
        return this.state.currentProject[settingName] !== value;
    }

    renderLoadingProject() {
        if (!this.state.projects) {
            return (<tr>
                <td id={"loading-project"}>
                    <CircularProgress/>
                </td>
            </tr>);
        } else {
            return <div/>;
        }
    }

    renderProjectsView() {
        if (!this.state.currentProject) {
            return <table id={"projects-view"}>
                <tbody>
                {this.renderLoadingProject()}
                <tr id="no-projects" style={this.state.projects && this.state.projects.length === 0 ?
                    {display: "table-row"} : {display: "none"}}>
                    <td style={{textAlign: "center"}}>
                        <h3 style={{fontFamily: 'Roboto-Regular'}}>Welcome to Rapid!</h3>
                        <p style={{fontFamily: 'Roboto-Regular'}}>You have no projects so far.</p>
                        <Button onClick={() => this.openNewProjectDialog()} variant={"outlined"}
                                startIcon={<Add/>}>Create New Project</Button>
                    </td>
                </tr>
                {(this.state.projects && this.state.projects.length !== 0) && this.displayListView()}
                </tbody>
            </table>
        } else {
            return (<div/>);
        }
    }

    isValidUrl(url) {
        return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
    }

    getObjectByApi(api) {
        for (let index in androidSdks) {
            let obj = androidSdks[index];
            if (obj.api === api) {
                return obj;
            }
        }
    }

    handleCloseExportProjectDialog(import_) {
        let data = this.state;
        data.exportProjectDialogOpen = false;
        this.setState(data);
        if (import_) {
            this.doExportSelectedProjects(true, this.state.exportAsZipRadioChecked);
        }
    }

    showSuccessSnackbar(message) {
        let data = this.state;
        data.successSnackbarMessage = message;
        this.setState(data);
    }

    showErrorSnackbar(message) {
        let data = this.state;
        data.errorSnackbarMessage = message;
        this.setState(data);
    }
}

function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 1.5}}>
                    {children}
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

export default App;