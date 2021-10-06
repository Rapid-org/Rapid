import './App.scss';
import logo from "./logo.png";
import React from "react";
import {
    Box, Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider, List, ListItem, ListItemButton, ListItemText,
    Snackbar,
    TextField
} from '@mui/material';
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
    Upload
} from '@mui/icons-material';
import firebase from "firebase/compat";
import {Button, createTheme, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {CircularProgress, ThemeProvider} from "@mui/material";
import UserManager from './UserManager';
import ProjectManager from './ProjectsManager';

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
            userAnchorEl: null,
            userOpen: false,
            projectAnchorEl: null,
            projectOpen: false,
            buildAnchorEl: null,
            buildOpen: false,
            isLoading: true,
            snackbarMessage: undefined,
            projects: null,
            newProjectDialogOpen: false,
            newProjectDialogProjectName: '',
            newProjectDialogProjectPackageName: '',
            newProjectDialogProjectDescription: '',
            checkedProjects: [],
            currentProject: undefined
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
        const firebaseConfig = {
            apiKey: "AIzaSyAJ_KkN5-XXJzdQni3Fkv1HyjnYHPJseaE",
            authDomain: "rapid-client.firebaseapp.com",
            projectId: "rapid-client",
            storageBucket: "rapid-client.appspot.com",
            messagingSenderId: "903527711453",
            appId: "1:903527711453:web:4685fdc673ff5b80481134",
            measurementId: "G-2R6PTZG4YS"
        };

        const app = firebase.initializeApp(firebaseConfig);
        app.auth().onAuthStateChanged((user) => {
            if (user) {
                let data = this.state;
                data.isLoading = false;
                this.setState(data, () => document.getElementById("user-image").src = user.photoURL);
                // resolve the user ID from the backend
                this.userManager = new UserManager(user);
                console.log("Resolving user id.");
                this.userManager.resolveUserID(() => {
                    console.log("Resolved user id");
                    this.userId = this.userManager.getUserId();
                    if (this.userId) {
                        this.projectManager = new ProjectManager(this.userManager.getUser());
                        this.loadProjects();
                    } else {
                        this.showSnackbar("The backend server is temporarily down.");
                    }
                });
            } else {
                window.location.href = "auth?callback=" + window.location.href;
            }
        });
    }

    loadProjects() {
        this.projectManager.fetchProjects(() => {
            if (this.projectManager.getProjects()) {
                console.log(this.projectManager.getProjects());
                const data = this.state;
                data.projects = this.projectManager.getProjects();
                console.log(data);
                this.setState(data);
            } else {
                this.showSnackbar("The backend server is temporarily down.");
            }
        });
    }

    handleToggle(value) {
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
        const data = this.state;
        data.userAnchorEl = value;
        data.userOpen = !this.state.userOpen;
        this.setState(data);
    }

    handleProjectMenuClose() {
        this.setProjectMenuAnchorEl(null);
    }

    openProjectMenu(event) {
        this.setProjectMenuAnchorEl(event.currentTarget);
    }

    setProjectMenuAnchorEl(value) {
        const data = this.state;
        data.projectAnchorEl = value;
        data.projectOpen = !this.state.projectOpen;
        this.setState(data);
    }

    handleUserMenuClose() {
        this.setUserMenuAnchorEl(null);
    }

    openBuildMenu(event) {
        this.setBuildMenuAnchorEl(event.currentTarget);
    }

    setBuildMenuAnchorEl(value) {
        const data = this.state;
        data.buildAnchorEl = value;
        data.buildOpen = !this.state.buildOpen;
        this.setState(data);
    }

    handleBuildMenuClose() {
        this.setBuildMenuAnchorEl(null);
    }

    handleSignOutClose() {
        firebase.auth().signOut().then();
        this.handleUserMenuClose();
    }

    openNewProjectDialog() {
        const data = this.state;
        data.newProjectDialogOpen = true;
        this.setState(data);
    }

    renderUserMenu() {
        return (
            <Menu id="fade-menu" anchorEl={this.state.userAnchorEl} getContentAnchorEl={null}
                  anchorOrigin={{vertical: "bottom", horizontal: "center"}}
                  transformOrigin={{vertical: "top", horizontal: "center"}} open={this.state.userOpen}
                  onClose={this.handleUserMenuClose}>
                <MenuItem onClick={this.handleSignOutClose}>
                    <ListItemIcon>
                        <ExitToApp fontSize="small"/>
                    </ListItemIcon>Log Out</MenuItem>
            </Menu>
        )
    }

    renderBuildMenu() {
        return (
            <Menu id="fade-menu" anchorEl={this.state.buildAnchorEl} getContentAnchorEl={null}
                  anchorOrigin={{vertical: "bottom", horizontal: "center"}}
                  transformOrigin={{vertical: "top", horizontal: "center"}} open={this.state.buildOpen}
                  onClose={this.handleBuildMenuClose}>
                <MenuItem onClick={this.handleBuildMenuClose}>
                    <ListItemIcon>
                        <BugReport fontSize="small"/>
                    </ListItemIcon>Build Project ( Debug )</MenuItem>
                <MenuItem onClick={this.handleBuildMenuClose}>
                    <ListItemIcon>
                        <NewReleases fontSize="small"/>
                    </ListItemIcon>Build Project ( Release )</MenuItem>
            </Menu>
        )
    }

    renderProjectMenu() {
        return (
            <Menu id="fade-menu" anchorEl={this.state.projectAnchorEl} getContentAnchorEl={null}
                  anchorOrigin={{vertical: "bottom", horizontal: "center"}}
                  transformOrigin={{vertical: "top", horizontal: "center"}} open={this.state.projectOpen}
                  onClose={this.handleProjectMenuClose}>
                <MenuItem>
                    <ListItemIcon>
                        <Folder fontSize="small"/>
                    </ListItemIcon>My Projects</MenuItem>
                <Divider/>
                <MenuItem>
                    <ListItemIcon>
                        <Settings fontSize="small"/>
                    </ListItemIcon>Options</MenuItem>
                <Divider/>
                <MenuItem>
                    <ListItemIcon>
                        <Add fontSize="small"/>
                    </ListItemIcon>New Project</MenuItem>
                <MenuItem>
                    <ListItemIcon>
                        <Delete fontSize="small"/>
                    </ListItemIcon>Delete Project</MenuItem>
                <MenuItem>
                    <ListItemIcon>
                        <Upload fontSize="small"/>
                    </ListItemIcon>Import Project</MenuItem>
                <MenuItem>
                    <ListItemIcon>
                        <Download fontSize="small"/>
                    </ListItemIcon>Export Project</MenuItem>
                <MenuItem>
                    <ListItemIcon>
                        <Save fontSize="small"/>
                    </ListItemIcon>Save Project</MenuItem>
            </Menu>
        )
    }

    render() {
        return (
            !this.state.isLoading ? (<ThemeProvider theme={this.theme}>
                <div className="App">
                    <div id="project-building-popup">
                        <div className="mdl-spinner mdl-js-spinner is-active"
                             style={{marginTop: "3.3vh", marginLeft: "2vh"}}/>
                        <p id="building-popup-label">Building Test..</p>
                    </div>
                    <table style={{width: "100%"}}>
                        <tbody>
                        <tr>
                            <td style={{width: "1px"}}>
                                <img src={logo} style={{width: "70px", height: "70px", marginTop: "10px"}}
                                     alt={"logo"}/>
                            </td>
                            {this.renderProjectMenu()}
                            {this.renderBuildMenu()}
                            <td id="project-toolbar" style={{visibility: "hidden"}}>
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
                                <img onClick={this.openUserMenu} id="user-image" alt={"user-icon"}/>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <div
                        style={!this.state.checkedProjects || this.state.checkedProjects.length === 0 || !this.state.currentProject || !this.projectManager ? {
                            display: 'flex',
                            alignItems: 'center',
                            margin: "10px"
                        } : {display: 'none'}} id={"projectsControls"}>
                        <Button variant="outlined" className='toolbar-button'
                                onClick={() => this.openNewProjectDialog()}
                                id={'project-controls-new-project-button'} color={"primary"} startIcon={<Add/>}> New
                            Project</Button>
                        <Button variant="outlined" className='toolbar-button'
                                id={'project-controls-import-project-button'} color={"primary"}
                                startIcon={<Backup/>}> Import
                            Project</Button>
                    </div>
                    <div
                        style={this.state.checkedProjects && this.state.checkedProjects.length === 0 || !this.state.currentProject ? {display: 'none'} : {
                            display: 'flex',
                            alignItems: 'center',
                            margin: "10px"
                        }} id={"selectedProjectsControls"}>
                        <Button variant="outlined" className='toolbar-button'
                                onClick={() => this.doDeleteSelectedProjects()}
                                id={'selected-project-controls-delete-project-button'} color={"primary"}
                                startIcon={<Delete/>}> Delete
                            Project</Button>
                        <Button variant="outlined" className='toolbar-button'
                                id={'selected-project-controls-export-project-button'} color={"primary"}
                                startIcon={<Download/>}> Export
                            Project</Button>
                    </div>
                    {!this.state.currentProject ? <table id={"projects-view"}>
                        <tbody>
                        <tr>
                            <td id={"loading-project"} style={!this.state.projects ?
                                {display: "table-column"} : {display: "none"}}>
                                <CircularProgress/>
                            </td>
                        </tr>
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
                        <Snackbar onClose={() => this.showSnackbar(undefined)}
                                  open={!!this.state.snackbarMessage}
                                  autoHideDuration={6000}
                                  message={this.state.snackbarMessage ? this.state.snackbarMessage : ""}/>
                    </table> : <table id={"project-view"}></table>}
                    <Dialog
                        open={this.state.newProjectDialogOpen}
                        onClose={this.handleNewProjectDialogClose}
                        aria-labelledby="responsive-dialog-title"
                    >
                        <DialogTitle id="responsive-dialog-title">
                            {"Create New Project"}
                        </DialogTitle>
                        <DialogContent dividers>
                            <TextField onChange={(e) => {
                                const data = this.state;
                                data.newProjectDialogProjectName = e.target.value;
                                this.setState(data);
                            }} required label="Name" variant="outlined"
                                       helperText={"The project's name. Must be in UpperCamelCase to match appinventor extension name conventions."}
                                       style={{marginTop: "10px", marginBottom: "20px"}}/>
                            <Divider/>
                            <TextField onChange={(e) => {
                                const data = this.state;
                                data.newProjectDialogProjectPackageName = e.target.value;
                                this.setState(data);
                            }} required label="Package Name" variant="outlined"
                                       helperText={"The project's package name. Must be in UpperCamelCase to match appinventor extension name conventions."}
                                       style={{marginTop: "20px", marginBottom: "20px"}}/>
                            <Divider/>
                            <TextField onChange={(e) => {
                                const data = this.state;
                                data.newProjectDialogProjectDescription = e.target.value;
                                this.setState(data);
                            }} label="Package Description" variant="outlined"
                                       helperText={"The project's description. Shown in the extension's info."}
                                       style={{marginTop: "20px", width: "553px"}}/>
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
                </div>
            </ThemeProvider>) : (<ThemeProvider theme={this.theme}>
                <div className={"centered-progress"}><CircularProgress/></div>
            </ThemeProvider>)
        );
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
            this.showSnackbar("Please enter a name for your project.");
            return;
        }
        if (!this.state.newProjectDialogProjectPackageName || this.state.newProjectDialogProjectPackageName.length === 0) {
            this.showSnackbar("Please enter a package name for your project.");
            return;
        }
        this.projectManager.newProject({
            name: this.state.newProjectDialogProjectName,
            packageName: this.state.newProjectDialogProjectPackageName,
            description: this.state.newProjectDialogProjectDescription || '',
        }, (statusCode) => {
            if (statusCode === 200) {
                this.showSnackbar("Project Created Successfully!");
                this.loadProjects();
                let data = this.state;
                data.projects = undefined;
                this.setState(data);
            } else if (statusCode === 409) {
                this.showSnackbar("A project with the same name already exists.");
            } else {
                this.showSnackbar("The server encountered an error while creating your project. Status Code: " + statusCode);
            }
        });
        this.handleNewProjectDialogClose();
    }

    doDeleteSelectedProjects() {
        for (let project in this.state.checkedProjects) {
            this.projectManager.deleteProject(this.state.checkedProjects[project], (success) => {
                console.log(success);
                if (!success) {
                    this.showSnackbar("Failed to delete project " + project.name);
                }
            })
        }
        this.showSnackbar("Successfully deleted project(s).");
        let data = this.state;
        data.projects = undefined;
        data.checkedProjects = [];
        this.setState(data);
        this.loadProjects();
    }

    displayListView() {
        return <tr id={"projects-list"} style={this.state.projects && this.state.projects.length !== 0 ?
            {display: "table-row", verticalAlign: "top"} : {display: "none"}}>
            <td style={{textAlign: "center"}}>
                <Box sx={{bgcolor: 'background.paper'}}>
                    <nav>
                        <List>
                            {this.state.projects.map((project) =>
                                <ListItem>
                                    <ListItemButton onClick={() => this.openProject(project)}
                                                    style={{height: "61px", borderRadius: "10px"}} dense>
                                        <ListItemIcon>
                                            <Checkbox
                                                onClick={() => this.handleToggle(project)}
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
                            )}
                        </List>
                    </nav>
                </Box>
            </td>
        </tr>
    }

    openProject(project) {
        let data = this.state;
        data.currentProject = project;
        this.setState(data);
    }
}

export default App;