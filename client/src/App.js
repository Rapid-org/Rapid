import './App.scss';
import logo from './logo.png';
import aboutDialog from './about_dialog.png';
import React from 'react';
import JSZip from 'jszip';
import MonacoEditor from '@uiw/react-monacoeditor';
import Lottie from 'react-lottie-player';
import welcomeLottieJson from './9757-welcome.json';
import i18next from 'i18next';
import { SketchPicker } from 'react-color';

import {
	Alert,
	Autocomplete,
	Avatar,
	Backdrop,
	Box,
	Button,
	Card,
	CardActionArea,
	CardActions,
	CardContent,
	Checkbox,
	CircularProgress,
	createTheme,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	Grid,
	IconButton,
	InputAdornment,
	List,
	ListItem,
	ListItemAvatar,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Paper,
	Popover,
	Portal,
	Radio,
	RadioGroup,
	Snackbar,
	Switch,
	Tab,
	Tabs,
	TextField,
	ThemeProvider,
	Tooltip,
	Typography
} from '@mui/material';
import PropTypes from 'prop-types';
import {
	Add,
	AttachFile,
	AutoAwesome,
	Backup,
	BugReport,
	Delete,
	Download,
	ExitToApp,
	Extension,
	Folder,
	Info,
	NewReleases,
	Publish,
	Save,
	Search,
	Settings,
	Upload
} from '@mui/icons-material';
import UserManager from './UserManager';
import ProjectManager from './ProjectsManager';
import BlocklyWorkspace from './BlocklyWorkspace';
import { saveAs } from 'file-saver';
import { FileDrop } from 'react-file-drop';
import $ from 'jquery';
import QRCode from 'react-qr-code';
import firebase from 'firebase/compat';
import 'firebase/messaging/sw';

const generate = require('project-name-generator');

let BUILD_SERVER_URL = 'http://localhost:8080';
let firebaseApp;
const languages = [{ label: 'English', lang: 'en' }, { label: 'Arabic', lang: 'ar' }];
const androidSdks = [{
	label: 'Android 2.1 ( Api 7 )', api: 7
}, {
	label: 'Android 2.2.x ( Api 8 )', api: 8
}, {
	label: 'Android 2.3 - 2.3.2 ( Api 9 )', api: 9
}, {
	label: 'Android 2.3.3 - 2.3.7 ( Api 10 )', api: 10
}, {
	label: 'Android 3.0 ( Api 11 )', api: 11
}, {
	label: 'Android 3.1 ( Api 12 )', api: 12
}, {
	label: 'Android 3.2.x ( Api 13 )', api: 13
}, {
	label: 'Android 4.0.3 - 4.0.4 ( Api 15 )', api: 15
}, {
	label: 'Android 4.1.x ( Api 16 )', api: 16
}, {
	label: 'Android 4.2.x ( Api 17 )', api: 17
}, {
	label: 'Android 4.3.x ( Api 18 )', api: 18
}, {
	label: 'Android 4.4 - 4.4.4 ( Api 19 )', api: 19
}, {
	label: 'Android 5.0 ( Api 21 )', api: 21
}, {
	label: 'Android 5.1 ( Api 22 )', api: 22
}, {
	label: 'Android 6.0 ( Api 23 )', api: 23
}, {
	label: 'Android 7.0 ( Api 24 )', api: 24
}, {
	label: 'Android 7.1 ( Api 25 )', api: 25
}, {
	label: 'Android 8.0.0 ( Api 26 )', api: 26
}, {
	label: 'Android 8.1.0 ( Api 27 )', api: 27
}, {
	label: 'Android 9 ( Api 28 )', api: 28
}, {
	label: 'Android 10 ( Api 29 )', api: 29
}, {
	label: 'Android 11 ( Api 30 )', api: 30
}];

class App extends React.Component {
	constructor(props) {
		super(props);
		this.sortByEnum = {
			NAME_ASCENDING: "Sort By: Name ( Ascending )",
			NAME_DESCENDING: "Sort By: Name ( Descending )",
			DATE_CREATED_ASCENDING: "Sort By: Date Created ( Ascending )",
			DATE_CREATED_DESCENDING: "Sort By: Date Created ( Descending )",
			DATE_MODIFIED_ASCENDING: "Sort By: Date Modified ( Ascending )",
			DATE_MODIFIED_DESCENDING: "Sort By: Date Modified ( Descending )"
		}
		this.state = {
			userAnchorEl: undefined,
			userOpen: false,
			aboutRapidDialogOpen: false,
			projectAnchorEl: undefined,
			projectOpen: false,
			buildAnchorEl: undefined,
			buildOpen: false,
			helpAnchorEl: undefined,
			colorPickerAnchorEl: null,
			helpOpen: false,
			isLoading: true,
			snackbarMessage: undefined,
			projects: null,
			newProjectDialogOpen: false,
			newProjectDialogProjectName: '',
			newProjectDialogProjectPackageName: '',
			newProjectDialogProjectDescription: '',
			userSettingsTheme: false,
			checkedProjects: [],
			currentProject: undefined,
			deleteProjectDialogOpen: false,
			importFileDialogOpen: false,
			fileSelected: undefined,
			fileSelectedName: '',
			fileSelectedDescription: '',
			buildingProject: false,
			projectBuiltDialogOpen: false,
			optionsDialogOpen: false,
			projectOptionsProjectName: undefined,
			projectOptionsProjectDescription: undefined,
			projectOptionsPackageName: undefined,
			projectOptionsVersionName: undefined,
			projectOptionsVersionNumber: undefined,
			projectOptionsHomeWebsite: undefined,
			projectOptionsIcon: undefined,
			userSettingsLanguage: undefined,
			projectOptionsMinSdk: undefined,
			userName: '',
			projectOptionsTabValue: 'general',
			projectOptionsProguard: false,
			exportProjectDialogOpen: false,
			exportAsMultipleRadioChecked: false,
			exportAsZipRadioChecked: true,
			successSnackbarMessage: undefined,
			errorSnackbarMessage: undefined,
			classesData: undefined,
			importClassDialogOpen: false,
			classesDataFiler: '',
			loadingProject: false,
			backupSelectedProjects: true,
			projectOptionsAndroidManifest: undefined,
			userSettingsDialogOpen: false,
			userSettingsThemeColor: '#6200ee',
			sortBy: this.sortByEnum.DATE_MODIFIED_ASCENDING,
			sortMenuAnchorEl: null,
			sortMenuOpen: false
		};
		this.currentProjectBlob = undefined;
		this.uploadProjectFileInput = null;
		this.setUserMenuAnchorEl = this.setUserMenuAnchorEl.bind(this);
		this.openUserMenu = this.openUserMenu.bind(this);
		this.doSortProjects = this.doSortProjects.bind(this);
		this.handleUserMenuClose = this.handleUserMenuClose.bind(this);
		this.handleOpenColorPicker = this.handleOpenColorPicker.bind(this);
		this.handleCloseColorPicker = this.handleCloseColorPicker.bind(this);
		this.handleSignOutClose = this.handleSignOutClose.bind(this);
		this.setProjectMenuAnchorEl = this.setProjectMenuAnchorEl.bind(this);
		this.handleProjectMenuClose = this.handleProjectMenuClose.bind(this);
		this.handleChangeComplete = this.handleChangeComplete.bind(this);
		this.openProjectMenu = this.openProjectMenu.bind(this);
		this.openBuildMenu = this.openBuildMenu.bind(this);
		this.handleBuildMenuClose = this.handleBuildMenuClose.bind(this);
		this.setBuildMenuAnchorEl = this.setBuildMenuAnchorEl.bind(this);
		this.handleUserSettingsClose = this.handleUserSettingsClose.bind(this);
		this.openHelpMenu = this.openHelpMenu.bind(this);
		this.openUploadFile = this.openUploadFile.bind(this);
		this.handleHelpMenuClose = this.handleHelpMenuClose.bind(this);
		this.setHelpMenuAnchorEl = this.setHelpMenuAnchorEl.bind(this);
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
		this.handleSaveUserSettings = this.handleSaveUserSettings.bind(this);
		this.handleSaveProjectSettings = this.handleSaveProjectSettings.bind(this);
		this.projectSettingChanged = this.projectSettingChanged.bind(this);
		this.doExportSelectedProjects = this.doExportSelectedProjects.bind(this);
		this.handleChangeProjectOptionsTab = this.handleChangeProjectOptionsTab.bind(this);
		this.handleCloseExportProjectDialog = this.handleCloseExportProjectDialog.bind(this);
		this.handleCloseAboutRapidDialog = this.handleCloseAboutRapidDialog.bind(this);
		this.openExportProjectDialog = this.openExportProjectDialog.bind(this);
		this.openAboutRapidDialog = this.openAboutRapidDialog.bind(this);
		this.showSuccessSnackbar = this.showSuccessSnackbar.bind(this);
		this.setSortMenuAnchorEl = this.setSortMenuAnchorEl.bind(this);
		this.showErrorSnackbar = this.showErrorSnackbar.bind(this);
		this.handleCloseImportClassDialog = this.handleCloseImportClassDialog.bind(this);
		this.openImportClassDialog = this.openImportClassDialog.bind(this);
		this.loadClassesData = this.loadClassesData.bind(this);
		this.loadClassInfo = this.loadClassInfo.bind(this);
		this.lastFetchedClassesNum = 0;
		window.top['openImportClassDialog'] = this.openImportClassDialog;
		window.document.onkeydown = (event) => {
			if (event.ctrlKey && event.altKey && event.key === 'n') {
				this.openNewProjectDialog();
			} else if (event.ctrlKey && event.altKey && event.key === 's') {
				if (this.state.currentProject) {
					this.handleSaveProjectMenuItem();
				}
			}
		};
		const firebaseConfig = {
			apiKey: 'AIzaSyAJ_KkN5-XXJzdQni3Fkv1HyjnYHPJseaE',
			authDomain: 'rapid-client.firebaseapp.com',
			projectId: 'rapid-client',
			storageBucket: 'rapid-client.appspot.com',
			messagingSenderId: '903527711453',
			appId: '1:903527711453:web:4685fdc673ff5b80481134',
			measurementId: 'G-2R6PTZG4YS'
		};
		firebaseApp = firebase.initializeApp(firebaseConfig);
		console.log(firebaseApp);
		const messaging = firebase.messaging(firebaseApp);
		messaging.onMessage(function(e) {
			console.log(e);
		});
		firebaseApp
			.auth()
			.onAuthStateChanged((user) => {
				if (user) {
					user
						.getIdToken()
						.then(function(value) {
							console.log(value);
						});
					let data = this.state;
					data.isLoading = false;
					data.userName = user.displayName;
					this.setState(data);
					// resolve the user ID from the backend
					console.log(user);
					this.userManager = new UserManager(user);
					console.log('Resolving user id.');
					this.userManager.resolveUserID((success) => {
						console.log(success);
						if (success) {
							console.log('Resolved user id');
							this.userId = this.userManager.getUserId();
							console.log(this.userId);
							if (this.userId) {
								i18next.changeLanguage(this.userManager.getUser().language).then();
								console.log('Dark theme', this.userManager.getUser().darkTheme);
								let data = this.state;
								data.userSettingsTheme = this.userManager.getUser().darkTheme;
								data.userSettingsThemeColor = this.userManager.getUser().themeColor;
								if (this.userManager.getUser().darkTheme) {
									document.body.classList.add('DarkTheme');
								}

								this.setState(data);
								user
									.getIdToken()
									.then((token) => {
										this.projectManager = new ProjectManager(this.userManager.getUser(), token);
										this.loadProjects();
										console.log(this.state.userSettingsTheme);
									});
							} else {
								this.showErrorSnackbar('This user doesn\'t exist on our server.');
							}
						} else {
							this.showErrorSnackbar('Failed to fetch the user information from the backend.');
						}
					});
				} else {
					window.location.href = 'auth?callback=' + window.location.href;
				}
			});
		setInterval(async () => {
			if (!this.state.currentProject && this.projectManager && this.state.checkedProjects.length === 0) {
				this.loadProjects();
			}
			if (this.state.currentProject) {
				//this.updateCurrentProject();
			}
		}, 5000);
	}

	updateCurrentProject() {
		this.projectManager.loadProjectInformation(this.state.currentProject._id, (status, project) => {
			if (status === 200) {
				if (JSON.stringify(this.state.currentProject) !== JSON.stringify(project)) {
					if (this.state.currentProject.blocks !== project.blocks) {
						this.blocklyWorkspace.updateWorkspaceBlocks(project.blocks);
					}
					console.log(project);
					let data = this.state;
					data.currentProject = project;
					this.setState(data);
				}
			} else if (status === 401) {
				this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
			} else {
				this.showErrorSnackbar('Failed to update project from the backend.');
			}
		});
	}

	loadProjects() {
		this.projectManager.fetchProjects((status) => {
			if (status === 200) {
				if (this.projectManager.getProjects()) {
					if (!this.compareArrays(this.state.projects, this.projectManager.getProjects())) {
						console.log(this.projectManager.getProjects())
						const data = this.state;
						data.currentProject = undefined; // unload any existing project.
						this.setState(data, () => {
							if (this.projectToLoad) {
								this.openProject(this.projectToLoad);
								this.projectToLoad = undefined;
							}
						});
						this.doSortProjects(this.projectManager.getProjects());
					}
				} else {
					this.showErrorSnackbar('Failed to fetch the projects from the backend server.');
				}
			} else if (status === 401) {
				this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
			} else {
				this.showErrorSnackbar('Failed to fetch the projects from the backend server.');
			}
		});
	}

	compareArrays(a1, a2) {
		if (!a1 || !a2) {
			return false;
		}
		if (a1.length !== a2.length) {
			return false;
		}
		let i = a1.length;
		while (i--) {
			if (a2.includes(a1[i])) {
				return false;
			}
		}
		return true;
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

	openHelpMenu(event) {
		this.setHelpMenuAnchorEl(event.currentTarget);
	}

	setHelpMenuAnchorEl(value) {
		if (value) {
			const data = this.state;
			data.helpAnchorEl = value;
			data.helpOpen = true;
			this.setState(data);
		}
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

	handleHelpMenuClose() {
		const data = this.state;
		data.helpAnchorEl = undefined;
		data.helpOpen = false;
		this.setState(data);
	}

	handleSignOutClose() {
		firebaseApp.auth().signOut().then();
		this.handleUserMenuClose();
	}

	handleUserSettingsClose() {
		this.openUserSettingsDialog();
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
		data.fileSelectedDescription = '';
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

	handleCloseAboutRapidDialog() {
		const data = this.state;
		data.aboutRapidDialogOpen = false;
		this.setState(data);
	}

	handleCloseUserSettingsDialog() {
		const data = this.state;
		data.userSettingsDialogOpen = false;
		data.userSettingsTheme = this.userManager.getUser().darkTheme;
		data.userSettingsThemeColor = this.userManager.getUser().themeColor;
		if (data.userSettingsTheme) {
			document.body.classList.add('DarkTheme');
		} else {
			document.body.classList.remove('DarkTheme');
		}
		this.setState(data);
	}

	handleSaveUserSettings() {
		let newUser = this.userManager.getUser();
		console.log(this.state.userSettingsLanguage.lang);
		console.log(this.userManager.getUser());
		if (this.state.userSettingsLanguage.lang !== this.userManager.getUser().language) {
			newUser.language = this.state.userSettingsLanguage.lang;
		}
		if (this.state.userSettingsTheme !== this.userManager.getUser().darkTheme) {
			newUser.darkTheme = this.state.userSettingsTheme;
		}
		if (this.state.userSettingsThemeColor !== this.userManager.getUser().themeColor) {
			newUser.themeColor = this.state.userSettingsThemeColor;
		}
		console.log(newUser);
		this.userManager.updateUser(newUser, (status) => {
			if (status === 200) {
				this.handleCloseUserSettingsDialog();
				this.showSuccessSnackbar('Settings were successfully updated.');
				window.location.reload();
			} else if (status === 401) {
				this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
			} else {
				this.showSuccessSnackbar('An error occurred while updating settings.');
			}
		});
	}

	openUserSettingsDialog() {
		const data = this.state;
		data.userSettingsDialogOpen = true;
		console.log(this.userManager.getUser());
		data.userSettingsLanguage = this.userManager.getUser().language ? this.findLangObj(this.userManager.getUser().language) : {
			label: 'English', lang: 'en'
		};
		data.userSettingsTheme = this.userManager.getUser().darkTheme;
		this.setState(data);
	}

	findLangObj(lang) {
		for (var i in languages) {
			var langObj = languages[i];
			if (langObj.lang === lang) {
				return langObj;
			}
		}
		return null;
	}

	openAboutRapidDialog() {
		const data = this.state;
		data.aboutRapidDialogOpen = true;
		this.setState(data);
	}

	openProjectOptionsDialog() {
		const data = this.state;
		data.optionsDialogOpen = true;
		data.projectOptionsProjectName = this.state.currentProject.name;
		data.projectOptionsProjectDescription = this.state.currentProject.description.replaceAll('<br>', '\n');
		data.projectOptionsPackageName = this.state.currentProject.packageName;
		data.projectOptionsVersionName = this.state.currentProject.versionName;
		data.projectOptionsVersionNumber = this.state.currentProject.versionNumber;
		data.projectOptionsMinSdk = this.getObjectByApi(this.state.currentProject.minSdk);
		data.projectOptionsHomeWebsite = this.state.currentProject.homeWebsite;
		console.log(this.state.currentProject);
		data.projectOptionsProguard = this.state.currentProject.proguard;
		data.projectOptionsAndroidManifest = this.state.currentProject.androidManifest;
		data.projectOptionsIcon = this.state.currentProject.icon;
		this.setState(data);
	}

	renderUserMenu() {
		return (<Menu
			id='fade-menu'
			anchorEl={this.state.userAnchorEl}
			anchorOrigin={{
				vertical: 'bottom', horizontal: 'center'
			}}
			transformOrigin={{
				vertical: 'top', horizontal: 'center'
			}}
			open={this.state.userOpen}
			onClose={this.handleUserMenuClose}
			autoFocus={false}
		>
			<MenuItem
				onClick={this.handleUserSettingsClose}
			>
				<ListItemIcon>
					<Settings
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				Settings
			</MenuItem>
			<Divider />
			<MenuItem
				onClick={this.handleSignOutClose}
			>
				<ListItemIcon>
					<ExitToApp
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				Log Out
			</MenuItem>
		</Menu>);
	}

	handleBuildProjectMenuItem() {
		this.handleBuildMenuClose();
		this.buildProject();
	}

	renderBuildMenu() {
		return (<Menu
			id='fade-menu'
			anchorEl={this.state.buildAnchorEl}
			anchorOrigin={{
				vertical: 'bottom', horizontal: 'left'
			}}
			transformOrigin={{
				vertical: 'top', horizontal: 'left'
			}}
			open={this.state.buildOpen}
			onClose={this.handleBuildMenuClose}
		>
			<MenuItem
				onClick={this.handleBuildProjectMenuItem}
			>
				<ListItemIcon>
					<BugReport
						fontSize='medium'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				Build Project ( Debug )
			</MenuItem>
			<MenuItem
				onClick={this.handleBuildProjectMenuItem}
			>
				<ListItemIcon>
					<NewReleases
						fontSize='medium'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				Build Project ( Release )
			</MenuItem>
		</Menu>);
	}

	renderHelpMenu() {
		return (<Menu
			id='fade-menu'
			anchorEl={this.state.helpAnchorEl}
			anchorOrigin={{
				vertical: 'bottom', horizontal: 'left'
			}}
			transformOrigin={{
				vertical: 'top', horizontal: 'left'
			}}
			open={this.state.helpOpen}
			onClose={this.handleHelpMenuClose}
		>
			<MenuItem
				onClick={this.openAboutRapidDialog}
			>
				<ListItemIcon>
					<Info
						fontSize='medium'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				About
			</MenuItem>
			<MenuItem
				onClick={this.handleBuildProjectMenuItem}
			>
				<ListItemIcon>
					<NewReleases
						fontSize='medium'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				Tutorials
			</MenuItem>
		</Menu>);
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
			if (this.state.backupSelectedProjects) {
				this.doExportSelectedProjects(true, true);
			}
			const projectsToDelete = this.projectsToDelete;
			let successfulDeletes = 0;
			let project;
			for (let projectIndex in projectsToDelete) {
				project = projectsToDelete[projectIndex];
				this.projectManager.deleteProject(project, (status) => {
					console.log(status);
					if (status === 401) {
						this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
						return;
					} else if (status !== 200) {
						this.showErrorSnackbar('Failed to delete project ' + project.name);
						return;
					} else {
						successfulDeletes++;
					}
					console.log(successfulDeletes.length);
					console.log(projectsToDelete.length - 1);
					if (projectIndex >= projectsToDelete.length - 1) {
						if (successfulDeletes === projectsToDelete.length - 1) {
							this.showSuccessSnackbar('Successfully deleted project.');
						}
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
			saveAs(this.currentProjectBlob, this.state.currentProject['name'] + '.rbx');
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
					const project_ = this.state.checkedProjects[index];
					this.openProject(project_, true, (project) => {
						console.log("Got project: " + JSON.stringify(project));
						this.blocklyWorkspace = new BlocklyWorkspace(project, this.projectManager, this.userManager.getUser().language);
						this.blocklyWorkspace.createProjectFile(project, (content, project) => {
							console.log(content);
							if (opt_zip) {
								zip.file(`${project['name']}.rbx`, content);
								console.log(parseInt(index));
								console.log(this.state.checkedProjects.length);
								if (parseInt(index) + 1 === this.state.checkedProjects.length) {
									zip
										.generateAsync({
											type: 'blob'
										})
										.then((content) => {
											saveAs(content, 'projects.zip');
										});
								}
							} else {
								saveAs(content, `${project['name']}.rbx`);
							}
						}, false);
						this.blocklyWorkspace.disposeBlocklyWorkspace();
						this.blocklyWorkspace = null;
					});
				}
			}
		} else if (this.state.checkedProjects.length === 1) {
			let project_ = this.state.checkedProjects[0];
			this.openProject(project_, true, (project) => {
				this.blocklyWorkspace = new BlocklyWorkspace(project, this.projectManager, this.userManager.getUser().language);
				this.blocklyWorkspace.createProjectFile(project, (content, project) => {
					saveAs(content, `${project['name']}.rbx`);
				});
			});
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
		return (<Menu
			id='fade-menu'
			anchorEl={this.state.projectAnchorEl}
			anchorOrigin={{
				vertical: 'bottom', horizontal: 'left'
			}}
			transformOrigin={{
				vertical: 'top', horizontal: 'left'
			}}
			open={this.state.projectOpen}
			onClose={this.handleProjectMenuClose}
		>
			<MenuItem
				onClick={this.handleMyProjectsMenuItem}
			>
				<ListItemIcon>
					<Folder
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				{i18next.t('my_projects')}
			</MenuItem>
			<Divider />
			<MenuItem
				onClick={this.handleProjectOptionsMenuItem}
			>
				<ListItemIcon>
					<Settings
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				{i18next.t('options')}
			</MenuItem>
			<Divider />
			<MenuItem
				onClick={this.handleNewProjectMenuItem}
			>
				<ListItemIcon>
					<Add
						style={{ fill: 'black' }}
						fontSize='small'
					/>
				</ListItemIcon>
				<ListItemText>
					{i18next.t('new_project')}
				</ListItemText>
			</MenuItem>
			<MenuItem
				onClick={this.handleSaveProjectMenuItem}
			>
				<ListItemIcon>
					<Save
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				{i18next.t('save_project')}
			</MenuItem>
			<MenuItem
				onClick={this.handleDeleteProjectMenuItem}
			>
				<ListItemIcon>
					<Delete
						style={{ fill: 'black' }}
						fontSize='small'
					/>
				</ListItemIcon>
				{i18next.t('delete_project')}
			</MenuItem>
			<MenuItem
				onClick={this.handleImportProjectMenuItem}
			>
				<ListItemIcon>
					<Upload
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				{i18next.t('import_project')}
			</MenuItem>
			<MenuItem
				onClick={this.handleExportProjectMenuItem}
			>
				<ListItemIcon>
					<Download
						fontSize='small'
						style={{ fill: 'black' }}
					/>
				</ListItemIcon>
				{i18next.t('export_project')}
			</MenuItem>
		</Menu>);
	}

	render() {
		this.theme = createTheme({
			palette: {
				mode: this.state.userSettingsTheme ? 'dark' : 'light', primary: {
					main: this.state.userSettingsThemeColor
				}
			}
		});
		return !this.state.isLoading ? (<ThemeProvider theme={this.theme}>
			<Paper
				style={{ minHeight: '100vh' }}
			>
				<div className='App'>
					<div id='project-building-popup'>
						<CircularProgress />
						<p id='building-popup-label'>
							Building Test..
						</p>
					</div>
					<table
						style={{ width: '100%' }}
					>
						<tbody>
						<tr>
							<td
								style={{
									width: '1px'
								}}
							>
								<div
									style={{
										width: '70px',
										height: '70px',
										marginTop: '10px',
										WebkitMask: 'url(' + logo + ') center/contain',
										mask: logo,
										background: this.state.userSettingsThemeColor
									}}
									alt={'logo'}
									class={'logo'}
								/>
							</td>
							<Dialog
								open={this.state.importFileDialogOpen}
								onClose={this.handleCloseImportFileDialog}
								maxWidth={'md'}
								aria-labelledby='alert-dialog-title'
								aria-describedby='alert-dialog-description'
							>
								<DialogTitle id='alert-dialog-title'>
									{'Import Project'}
								</DialogTitle>
								<DialogContent
									dividers
									style={{
										width: '645px', height: '250px'
									}}
								>
									<FileDrop
										onDrop={(files) => this.processImportedFiles(files)}
									>
										Drag & Drop Your
										.rbx file here
										<p
											style={{
												textAlign: 'center'
											}}
										>
											Or
										</p>
										<input
											accept='.rbx'
											id='file-upload-btn'
											style={{
												display: 'none'
											}}
											type='file'
											onChange={(e) => this.processImportedFiles(e.target.files)}
										/>
										<label
											htmlFor='file-upload-btn'
											style={{
												textAlign: 'center', display: 'block', color: '#6200ee', cursor: 'pointer', fontWeight: 'bold'
											}}
										>
											Browse to
											upload
										</label>
									</FileDrop>
									<List
										sx={{
											marginTop: '55px', width: '100%', bgcolor: 'background.paper'
										}}
									>
										{this.renderFileList()}
									</List>
								</DialogContent>
								<DialogActions>
									<Button
										onClick={this.handleCloseImportFileDialog}
									>
										Cancel
									</Button>
									<Button
										onClick={() => this.processImportedFiles(this.state.fileSelected, true)}
										autoFocus
										disabled={!this.state.fileSelected}
									>
										Import
									</Button>
								</DialogActions>
							</Dialog>
							{this.renderProjectMenu()}
							{this.renderBuildMenu()}
							{this.renderHelpMenu()}
							<td
								id='project-toolbar'
								style={this.state.currentProject ? {
									visibility: 'visible'
								} : {
									visibility: 'hidden'
								}}
							>
								<Button
									variant='outlined'
									id={'file-button'}
									className='toolbar-button'
									color={'primary'}
									onClick={this.openProjectMenu}
								>
									{i18next.t('project')}
								</Button>
								<Button
									variant='outlined'
									id={'build-button'}
									className='toolbar-button'
									color={'primary'}
									onClick={this.openBuildMenu}
								>
									{i18next.t('build')}
								</Button>
								<Button
									variant='outlined'
									id={'help-button'}
									className='toolbar-button'
									color={'primary'}
									onClick={this.openHelpMenu}
								>
									{i18next.t('help')}
								</Button>
							</td>
							<td
								style={{
									float: 'right'
								}}
							>
								{this.renderUserMenu()}
								<Avatar
									sx={{
										width: 48, height: 48, bgcolor: this.state.userSettingsThemeColor
									}}
									style={{
										marginBottom: '10px', marginTop: '24px', marginRight: '10px'
									}}
									onClick={this.openUserMenu}
								>
									{this.state.userName.charAt(0)}
								</Avatar>
							</td>
						</tr>
						</tbody>
					</table>
					<div
						style={(!this.state.checkedProjects || this.state.checkedProjects.length === 0) && !this.state.currentProject && this.projectManager ? {
							display: 'flex', alignItems: 'center', margin: '10px'
						} : { display: 'none' }}
						id={'projectsControls'}
					>
						<Button
							variant='outlined'
							className='toolbar-button'
							onClick={() => this.openNewProjectDialog()}
							id={'project-controls-new-project-button'}
							color={'primary'}
							startIcon={<Add />}
						>
							{i18next.t('new_project')}
						</Button>
						<Button
							onClick={this.openImportFileDialog}
							variant='outlined'
							className='toolbar-button'
							id={'project-controls-import-project-button'}
							color={'primary'}
							startIcon={<Backup />}
						>
							{i18next.t('import_project')}
						</Button>
						<Button
							variant='outlined'
							className='toolbar-button'
							onClick={(e) => this.setSortMenuAnchorEl(e.currentTarget, null)}
							id={'project-controls-import-project-button'}
							color={'primary'}
						>
							{this.state.sortBy + "▾"}
						</Button>
						<Menu
							id="basic-menu"
							anchorEl={this.state.sortMenuAnchorEl}
							open={this.state.sortMenuOpen}
							onClose={() => this.setSortMenuAnchorEl(null, null)}
						>
							<MenuItem onClick={() => this.setSortMenuAnchorEl(null, this.sortByEnum.NAME_ASCENDING)}>{this.sortByEnum.NAME_ASCENDING}</MenuItem>
							<MenuItem onClick={() => this.setSortMenuAnchorEl(null, this.sortByEnum.NAME_DESCENDING)}>{this.sortByEnum.NAME_DESCENDING}</MenuItem>
							<MenuItem onClick={() => this.setSortMenuAnchorEl(null, this.sortByEnum.DATE_CREATED_ASCENDING)}>{this.sortByEnum.DATE_CREATED_ASCENDING}</MenuItem>
							<MenuItem onClick={() => this.setSortMenuAnchorEl(null, this.sortByEnum.DATE_CREATED_DESCENDING)}>{this.sortByEnum.DATE_CREATED_DESCENDING}</MenuItem>
							<MenuItem onClick={() => this.setSortMenuAnchorEl(null, this.sortByEnum.DATE_MODIFIED_ASCENDING)}>{this.sortByEnum.DATE_MODIFIED_ASCENDING}</MenuItem>
							<MenuItem onClick={() => this.setSortMenuAnchorEl(null, this.sortByEnum.DATE_MODIFIED_DESCENDING)}>{this.sortByEnum.DATE_MODIFIED_DESCENDING}</MenuItem>
						</Menu>
					</div>
					<div
						style={!this.state.checkedProjects || this.state.checkedProjects.length === 0 || this.state.currentProject ? { display: 'none' } : {
							display: 'flex', alignItems: 'center', margin: '10px'
						}}
						id={'selectedProjectsControls'}
					>
						<Button
							variant='outlined'
							className='toolbar-button'
							onClick={() => this.doDeleteSelectedProjects()}
							id={'selected-project-controls-delete-project-button'}
							color={'primary'}
							startIcon={<Delete />}
						>
							{i18next.t('delete_project')}
						</Button>
						<Button
							onClick={() => this.doExportSelectedProjects()}
							variant='outlined'
							className='toolbar-button'
							id={'selected-project-controls-export-project-button'}
							color={'primary'}
							startIcon={<Download />}
						>
							{' '}
							{i18next.t('export_project')}
						</Button>
					</div>
					{this.renderProjectsView()}
					<table
						id={'project-view-table'}
						style={this.state.currentProject ? { display: 'table' } : { display: 'none' }}
					>
						<tbody>
						<tr
							id={'project-view-tr'}
						>
							<td
								id={'project-view'}
								style={{
									position: 'absolute', height: '84vh', width: '99%'
								}}
							>
								{/*The blockly workspace is injected here at runtime*/}
							</td>
						</tr>
						</tbody>
					</table>
					<Dialog
						open={this.state.newProjectDialogOpen}
						onClose={this.handleNewProjectDialogClose}
						aria-labelledby='responsive-dialog-title'
					>
						<DialogTitle id='responsive-dialog-title'>
							{i18next.t('create_new_project')}
						</DialogTitle>
						<DialogContent dividers>
							<TextField
								fullWidth
								onChange={(e) => {
									const data = this.state;
									data.newProjectDialogProjectName = e.target.value;
									this.setState(data);
								}}
								value={this.state.newProjectDialogProjectName}
								InputProps={{
									endAdornment: (<InputAdornment position='end'>
										<Tooltip title='Generate Project Name'>
											<IconButton
												onClick={() => {
													const rawProjectName = generate().raw;
													// convert the row project name into UpperCamelCase
													let finalProjectName = '';
													for (let index in rawProjectName) {
														finalProjectName += rawProjectName[index]
															.charAt(0)
															.toUpperCase() + rawProjectName[index].substring(1, rawProjectName[index].length);
													}
													const data = this.state;
													data.newProjectDialogProjectName = finalProjectName;
													this.setState(data);
												}}
												edge='end'
											>
												<AutoAwesome />
											</IconButton>
										</Tooltip>
									</InputAdornment>)
								}}
								error={this.state.newProjectDialogProjectName.length > 0 && !this.isClassNameValid(this.state.newProjectDialogProjectName)}
								required
								label={i18next.t('name')}
								variant='outlined'
								helperText={'The project\'s name. Must be in UpperCamelCase to match appinventor extension name conventions.'}
								style={{
									marginTop: '10px', marginBottom: '20px'
								}}
							/>
							<Divider />
							<TextField
								onChange={(e) => {
									const data = this.state;
									data.newProjectDialogProjectPackageName = e.target.value;
									this.setState(data);
								}}
								fullWidth
								required
								label='Package Name'
								variant='outlined'
								helperText={'The project\'s package name. Must be in UpperCamelCase to match appinventor extension name conventions.'}
								style={{
									marginTop: '20px', marginBottom: '20px'
								}}
							/>
							<Divider />
							<TextField
								onChange={(e) => {
									const data = this.state;
									data.newProjectDialogProjectDescription = e.target.value;
									this.setState(data);
								}}
								fullWidth
								multiline
								label='Project Description'
								variant='outlined'
								helperText={'The project\'s description. Shown in the extension\'s info. Supports HTML.'}
								style={{
									marginTop: '20px'
								}}
							/>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={this.handleNewProjectDialogClose}
							>
								Cancel
							</Button>
							<Button
								onClick={this.doCreateNewProject}
							>
								Create
							</Button>
						</DialogActions>
					</Dialog>
					<Dialog
						open={this.state.deleteProjectDialogOpen}
						onClose={() => this.handleCloseDeleteProjectDialog(false)}
						aria-labelledby='alert-dialog-title'
						aria-describedby='alert-dialog-description'
					>
						<DialogTitle id='alert-dialog-title'>
							{'Delete Project(s)?'}
						</DialogTitle>
						<DialogContent>
							<DialogContentText id='alert-dialog-description'>
								Deleted projects are
								irrecoverable. Take
								this action with
								caution, and make sure
								to take a backup
								beforehand.
							</DialogContentText>
							<FormGroup>
								<FormControlLabel control={<Checkbox onClick={(e) => {
									console.log(e.currentTarget.getElementsByTagName("input")[0].checked);
									let data = this.state;
									data.backupSelectedProjects = e.currentTarget.getElementsByTagName("input")[0].checked;
									this.setState(data);
								}}/>}  label="Backup selected projects as ZIP file."/>
							</FormGroup>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={() => this.handleCloseDeleteProjectDialog(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => this.handleCloseDeleteProjectDialog(true)}
								autoFocus
							>
								Confirm
							</Button>
						</DialogActions>
					</Dialog>
					<Dialog
						open={this.state.aboutRapidDialogOpen}
						onClose={() => this.handleCloseAboutRapidDialog(false)}
						aria-labelledby='alert-dialog-title'
						aria-describedby='alert-dialog-description'
					>
						<DialogTitle id='alert-dialog-title'>
							{'About Rapid'}
						</DialogTitle>
						<DialogContent>
							<div
								style={{
									textAlign: 'center'
								}}
							>
								<img
									src={aboutDialog}
									width={'300px'}
									height={'250px'}
								></img>
							</div>
							<DialogContentText id='alert-dialog-description'>
								Rapid is an online
								website that is used
								to build extensions
								for App Inventor 2
								using blocks.
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button>Close</Button>
						</DialogActions>
					</Dialog>
					<Dialog
						open={this.state.userSettingsDialogOpen}
						onClose={() => this.handleCloseUserSettingsDialog()}
						aria-labelledby='alert-dialog-title'
						aria-describedby='alert-dialog-description'
					>
						<DialogTitle id='alert-dialog-title'>
							{'Settings'}
						</DialogTitle>
						<DialogContent dividers>
							<Autocomplete
								disablePortal
								options={languages}
								fullWidth
								value={this.state.userSettingsLanguage ? this.state.userSettingsLanguage.label : languages[0]}
								onChange={(e, newValue) => {
									if (newValue) {
										let data = this.state;
										data.userSettingsLanguage = newValue;
										this.setState(data);
									}
								}}
								renderInput={(params) => (<TextField
									helperText={'Changes the Rapid interface language. This change applies to all of the devices with your account.'}
									{...params}
									label='Language'
								/>)}
							/>
							<Divider
								style={{
									margin: '10px 0'
								}}
							/>
							<FormControl fullWidth>
								<FormGroup>
									<FormControlLabel
										control={<Switch
											checked={this.state.userSettingsTheme}
											onChange={(e) => {
												console.log(this.state.userSettingsTheme);
												let data = this.state;
												data.userSettingsTheme = e.target.checked;
												if (data.userSettingsTheme) {
													data.userSettingsThemeColor = "#ffffff";
												} else {
													data.userSettingsThemeColor = this.userManager.getUser().themeColor;
												}
												this.setState(data, () => {
													if (e.target.checked) {
														document.body.classList.add('DarkTheme');
													} else {
														document.body.classList.remove('DarkTheme');
													}
												});
											}}
										/>}
										label='Dark Theme'
									/>
									<FormHelperText>
										Changes the
										primary theme for
										Rapid interface.
									</FormHelperText>
								</FormGroup>
							</FormControl>
							<Divider
								style={{
									margin: '15px 0'
								}}
							/>
							<TextField
								id='outlined-basic'
								label='Color'
								variant='outlined'
								fullWidth
								value={this.state.userSettingsThemeColor}
								onClick={this.handleOpenColorPicker}
								helperText={"Change's Rapid primary interface color."}
							/>
							<Popover
								open={!!this.state.colorPickerAnchorEl}
								anchorEl={this.state.colorPickerAnchorEl}
								onClose={this.handleCloseColorPicker}
								anchorOrigin={{
									vertical: 'bottom', horizontal: 'left'
								}}
							>
								<SketchPicker
									color={this.state.userSettingsThemeColor}
									onChangeComplete={this.handleChangeComplete}
									presetColors={['#6200ee', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0', '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF']}
								/>
							</Popover>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={() => this.handleCloseUserSettingsDialog()}
							>
								Cancel
							</Button>
							<Button
								onClick={() => this.handleSaveUserSettings()}
							>
								Save
							</Button>
						</DialogActions>
					</Dialog>
					<Dialog
						open={this.state.importClassDialogOpen}
						onClose={() => this.handleCloseImportClassDialog()}
						aria-labelledby='alert-dialog-title'
						aria-describedby='alert-dialog-description'
					>
						<DialogTitle id='alert-dialog-title'>
							{'Import Class'}
						</DialogTitle>
						<DialogContent
							dividers
							id={'classes-data-grid'}
						>
							<TextField
								id='filled-basic'
								label='Search'
								onChange={(e) => {
									let data = this.state;
									data.classesDataFiler = e.target.value;
									this.setState(data);
								}}
								fullWidth
								sx={{
									marginBottom: '20px', display: this.state.classesData ? 'display' : 'none'
								}}
								variant='outlined'
								InputProps={{
									endAdornment: (<InputAdornment position='end'>
										<IconButton
											onClick={() => {
												this.loadClassesData(false, this.state.classesDataFiler);
											}}
											edge='end'
										>
											<Search />
										</IconButton>
									</InputAdornment>)
								}}
							/>
							<Grid
								container
								rowSpacing={1}
								columnSpacing={{
									xs: 1, sm: 2, md: 3
								}}
							>
								{this.renderClassesData()}
							</Grid>
						</DialogContent>
						<DialogActions dividers>
							<Button
								onClick={() => this.handleCloseImportClassDialog()}
							>
								Close
							</Button>
							<Button
								disabled={this.lastFetchedClassesNum <= 50}
								onClick={() => this.loadClassesData(true)}
							>
								Back
							</Button>
							<Button
								onClick={() => this.loadClassesData()}
							>
								Next
							</Button>
						</DialogActions>
					</Dialog>
					<Dialog
						open={this.state.exportProjectDialogOpen}
						onClose={() => this.handleCloseExportProjectDialog(false)}
						aria-labelledby='alert-dialog-title'
						aria-describedby='alert-dialog-description'
					>
						<DialogTitle id='alert-dialog-title'>
							{'Export Projects?'}
						</DialogTitle>
						<DialogContent>
							<DialogContentText id='alert-dialog-description'>
								You are exporting
								multiple projects.
								Please select how do
								you want to export
								them.
							</DialogContentText>
							<FormControl component='fieldset'>
								<RadioGroup
									row
									aria-label='gender'
									name='row-radio-buttons-group'
								>
									<FormControlLabel
										value='zip'
										control={<Radio
											checked={this.state.exportAsZipRadioChecked}
											onChange={(e) => {
												let data = this.state;
												data.exportAsZipRadioChecked = e.target.checked;
												data.exportAsMultipleRadioChecked = false;
												this.setState(data);
											}}
										/>}
										label='Export As Zip File ( Recommended )'
									/>
									<FormControlLabel
										value='multiple'
										control={<Radio
											checked={this.state.exportAsMultipleRadioChecked}
											onChange={(e) => {
												let data = this.state;
												data.exportAsMultipleRadioChecked = e.target.checked;
												data.exportAsZipRadioChecked = false;
												this.setState(data);
											}}
										/>}
										label='Export As Multiple Files ( Could Be Blocked By the Browser )'
									/>
								</RadioGroup>
							</FormControl>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={() => this.handleCloseExportProjectDialog(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => this.handleCloseExportProjectDialog(true)}
								autoFocus
							>
								Export
							</Button>
						</DialogActions>
					</Dialog>
					<Dialog
						open={this.state.optionsDialogOpen}
						onClose={this.handleCloseProjectOptionsDialog}
						aria-labelledby='alert-dialog-title'
						aria-describedby='alert-dialog-description'
					>
						<DialogTitle id='alert-dialog-title'>
							{'Project Settings'}
						</DialogTitle>
						<DialogContent dividers>
							<Box
								sx={{ width: '100%' }}
							>
								<Box
									sx={{
										borderBottom: 1, borderColor: 'divider'
									}}
								>
									<Tabs
										value={this.state.projectOptionsTabValue}
										variant={'fullWidth'}
										indicatorColor='primary'
										textColor='primary'
										onChange={this.handleChangeProjectOptionsTab}
									>
										<Tab
											value={'general'}
											label={<div>
												<Extension
													style={{
														verticalAlign: 'middle'
													}}
												/>{' '}
												General
											</div>}
										/>
										<Tab
											value={'publishing'}
											label={<div>
												<Publish
													style={{
														verticalAlign: 'middle'
													}}
												/>{' '}
												Publishing
											</div>}
										/>
										<Tab
											value={'android_manifest'}
											label={<div>
												<Publish
													style={{
														verticalAlign: 'middle'
													}}
												/>{' '}
												Manifest
											</div>}
										/>
									</Tabs>
								</Box>
							</Box>
							<TabPanel
								index={'general'}
								value={this.state.projectOptionsTabValue}
							>
								<TextField
									onChange={(e) => {
										let data = this.state;
										data.projectOptionsProjectName = e.target.value || '';
										this.setState(data);
									}}
									disabled
									error={this.state.projectOptionsProjectName !== undefined ? this.state.projectOptionsProjectName.length > 0 && !this.isClassNameValid(this.state.projectOptionsProjectName) : false}
									fullWidth
									variant={'outlined'}
									label={i18next.t('name')}
									value={this.state.projectOptionsProjectName !== undefined ? this.state.projectOptionsProjectName : ''}
									helperText={'The project name. Must Be In UpperCamelCase to follow the appinventor naming conventions for extensions. This setting is unchangable for existing projects.'}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
								<TextField
									onChange={(e) => {
										let data = this.state;
										data.projectOptionsPackageName = e.target.value || '';
										this.setState(data);
									}}
									disabled
									error={this.state.projectOptionsPackageName !== undefined ? this.state.projectOptionsPackageName.length > 0 && !this.isPackageNameValid(this.state.projectOptionsPackageName) : false}
									fullWidth
									variant={'outlined'}
									label={'Package Name'}
									value={this.state.projectOptionsPackageName !== undefined ? this.state.projectOptionsPackageName : ''}
									helperText={'The project\'s package name. Must follow the java package naming conventions. This setting is unchangable for existing projects.'}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
								<TextField
									onChange={(e) => {
										let data = this.state;
										data.projectOptionsProjectDescription = e.target.value;
										this.setState(data);
									}}
									fullWidth
									multiline
									variant={'outlined'}
									label={'Description'}
									value={typeof this.state.projectOptionsProjectDescription === 'string' ? this.state.projectOptionsProjectDescription : ''}
									helperText={'The project description. Shown in the extension info when imported. Supports HTML.'}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
								<TextField
									onChange={(e) => {
										let data = this.state;
										data.projectOptionsVersionName = e.target.value || '';
										this.setState(data);
									}}
									fullWidth
									variant={'outlined'}
									label={'Version Name'}
									value={this.state.projectOptionsVersionName !== undefined ? this.state.projectOptionsVersionName : ''}
									helperText={'The project\'s version name. An example for version names are: 1.5, v14.3, v0.2-beta.'}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
								<TextField
									onChange={(e) => {
										let data = this.state;
										data.projectOptionsVersionNumber = e.target.value || '';
										this.setState(data);
									}}
									type={'number'}
									fullWidth
									variant={'outlined'}
									label={'Version Number'}
									value={this.state.projectOptionsVersionNumber !== undefined ? this.state.projectOptionsVersionNumber : ''}
									helperText={'The project\'s version number. Increment it with every release build.'}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
								<TextField
									onChange={(e) => {
										let data = this.state;
										data.projectOptionsHomeWebsite = e.target.value || '';
										this.setState(data);
									}}
									error={this.state.projectOptionsHomeWebsite && this.state.projectOptionsHomeWebsite.length !== 0 && !this.isValidUrl(this.state.projectOptionsHomeWebsite)}
									fullWidth
									variant={'outlined'}
									label={'Home Website'}
									value={this.state.projectOptionsHomeWebsite !== undefined ? this.state.projectOptionsHomeWebsite : ''}
									helperText={'The project\'s homepage url.'}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
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
									renderInput={(params) => (<TextField
										helperText={'The project\'s Min API value. The default value is 7. App Inventor distributions could override the min API if their apps defaults to a higher min SDK. which has modified the projects min. sdk, or allow the user to modify it.'}
										{...params}
										label='Min SDK'
									/>)}
								/>
								<Divider
									style={{
										marginTop: '10px', marginBottom: '20px'
									}}
								/>
								<TextField
									variant='outlined'
									label='Project Icon'
									fullWidth
									value={this.state.projectOptionsIcon}
									InputProps={{
										endAdornment: (<InputAdornment position='end'>
											<IconButton
												onClick={this.openUploadFile}
											>
												<AttachFile />
											</IconButton>
										</InputAdornment>)
									}}
								></TextField>
								<input
									type='file'
									id='file'
									ref={(ref) => {
										console.log('REFF', ref);
										this.uploadProjectFileInput = ref;
									}}
									style={{
										display: 'none'
									}}
								/>
							</TabPanel>
							<TabPanel
								index={'publishing'}
								value={this.state.projectOptionsTabValue}
							>
								<FormControl
									fullWidth
								>
									<FormGroup>
										<FormControlLabel
											control={<Switch
												checked={this.state.projectOptionsProguard}
												onChange={(e) => {
													console.log(this.state.projectOptionsProguard);
													let data = this.state;
													data.projectOptionsProguard = e.target.checked;
													this.setState(data);
												}}
											/>}
											label='Proguard Extension'
										/>
										<FormHelperText>
											Obfuscates and
											optimizes the
											source code for
											the output
											extension.
										</FormHelperText>
									</FormGroup>
								</FormControl>
							</TabPanel>
							<TabPanel
								index={'android_manifest'}
								value={this.state.projectOptionsTabValue}
							>
								<MonacoEditor
									language='xml'
									value={this.state.projectOptionsAndroidManifest}
									height='280px'
									width='530px'
									options={{
										theme: 'vs', automaticLayout: false, fontSize: 20
									}}
								/>
							</TabPanel>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={this.handleCloseProjectOptionsDialog}
							>
								Cancel
							</Button>
							<Button
								onClick={this.handleSaveProjectSettings}
								autoFocus
							>
								Save
							</Button>
						</DialogActions>
					</Dialog>
					<xml
						id='toolbox'
						style={{
							display: 'none'
						}}
					>
						<category
							colour='210'
							id='catLogic'
							name={i18next.t('logic')}
						>
							<block type='controls_if' />
							<block type='logic_compare' />
							<block type='logic_operation' />
							<block type='logic_negate' />
							<block type='logic_boolean' />
							<block type='logic_null' />
							<block type='logic_this' />
							<block type='logic_ternary' />
						</category>
						<category
							colour='120'
							id='catLoops'
							name={i18next.t('loops')}
						>
							<block type='controls_repeat_ext'>
								<value name='TIMES'>
									<shadow type='math_number'>
										<field name='NUM'>
											10
										</field>
									</shadow>
								</value>
							</block>
							<block type='controls_whileUntil' />
							<block type='controls_for'>
								<value name='FROM'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
								<value name='TO'>
									<shadow type='math_number'>
										<field name='NUM'>
											10
										</field>
									</shadow>
								</value>
								<value name='BY'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
							</block>
							<block type='controls_forEach' />
							<block type='controls_flow_statements' />
						</category>
						<category
							colour='230'
							id='catMath'
							name={i18next.t('math')}
						>
							<block type='math_number' />
							<block type='math_arithmetic'>
								<value name='A'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
								<value name='B'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_single'>
								<value name='NUM'>
									<shadow type='math_number'>
										<field name='NUM'>
											9
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_trig'>
								<value name='NUM'>
									<shadow type='math_number'>
										<field name='NUM'>
											45
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_constant' />
							<block type='math_number_property'>
								<value name='NUMBER_TO_CHECK'>
									<shadow type='math_number'>
										<field name='NUM'>
											0
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_change'>
								<value name='DELTA'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_round'>
								<value name='NUM'>
									<shadow type='math_number'>
										<field name='NUM'>
											3.1
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_on_list' />
							<block type='math_modulo'>
								<value name='DIVIDEND'>
									<shadow type='math_number'>
										<field name='NUM'>
											64
										</field>
									</shadow>
								</value>
								<value name='DIVISOR'>
									<shadow type='math_number'>
										<field name='NUM'>
											10
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_constrain'>
								<value name='VALUE'>
									<shadow type='math_number'>
										<field name='NUM'>
											50
										</field>
									</shadow>
								</value>
								<value name='LOW'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
								<value name='HIGH'>
									<shadow type='math_number'>
										<field name='NUM'>
											100
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_random_int'>
								<value name='FROM'>
									<shadow type='math_number'>
										<field name='NUM'>
											1
										</field>
									</shadow>
								</value>
								<value name='TO'>
									<shadow type='math_number'>
										<field name='NUM'>
											100
										</field>
									</shadow>
								</value>
							</block>
							<block type='math_random_float' />
						</category>
						<category
							colour='160'
							id='catText'
							name={i18next.t('text')}
						>
							<block type='text' />
							<block type='text_join' />
							<block type='text_append'>
								<value name='TEXT'>
									<shadow type='text' />
								</value>
							</block>
							<block type='text_length'>
								<value name='VALUE'>
									<shadow type='text'>
										<field name='TEXT'>
											abc
										</field>
									</shadow>
								</value>
							</block>
							<block type='text_isEmpty'>
								<value name='VALUE'>
									<shadow type='text'>
										<field name='TEXT' />
									</shadow>
								</value>
							</block>
							<block type='text_indexOf'>
								<value name='VALUE'>
									<block type='variables_get'>
										<field name='VAR'>
											text
										</field>
									</block>
								</value>
								<value name='FIND'>
									<shadow type='text'>
										<field name='TEXT'>
											abc
										</field>
									</shadow>
								</value>
							</block>
							<block type='text_charAt'>
								<value name='VALUE'>
									<block type='variables_get'>
										<field name='VAR'>
											text
										</field>
									</block>
								</value>
							</block>
							<block type='text_getSubstring'>
								<value name='STRING'>
									<block type='variables_get'>
										<field name='VAR'>
											text
										</field>
									</block>
								</value>
							</block>
							<block type='text_changeCase'>
								<value name='TEXT'>
									<shadow type='text'>
										<field name='TEXT'>
											abc
										</field>
									</shadow>
								</value>
							</block>
							<block type='text_trim'>
								<value name='TEXT'>
									<shadow type='text'>
										<field name='TEXT'>
											abc
										</field>
									</shadow>
								</value>
							</block>
							<block type='text_print'>
								<value name='TEXT'>
									<shadow type='text'>
										<field name='TEXT'>
											abc
										</field>
									</shadow>
								</value>
							</block>
						</category>
						<category
							colour='260'
							id='catLists'
							name={i18next.t('lists')}
						>
							<block type='lists_create_with'>
								<mutation items='0' />
							</block>
							<block type='lists_create_with' />
							<block type='lists_repeat'>
								<value name='NUM'>
									<shadow type='math_number'>
										<field name='NUM'>
											5
										</field>
									</shadow>
								</value>
							</block>
							<block type='lists_length' />
							<block type='lists_isEmpty' />
							<block type='lists_indexOf'>
								<value name='VALUE'>
									<block type='variables_get'>
										<field name='VAR'>
											list
										</field>
									</block>
								</value>
							</block>
							<block type='lists_getIndex'>
								<value name='VALUE'>
									<block type='variables_get'>
										<field name='VAR'>
											list
										</field>
									</block>
								</value>
							</block>
							<block type='lists_setIndex'>
								<value name='LIST'>
									<block type='variables_get'>
										<field name='VAR'>
											list
										</field>
									</block>
								</value>
							</block>
							<block type='lists_getSublist'>
								<value name='LIST'>
									<block type='variables_get'>
										<field name='VAR'>
											list
										</field>
									</block>
								</value>
							</block>
							<block type='lists_split'>
								<value name='DELIM'>
									<shadow type='text'>
										<field name='TEXT'>
											,
										</field>
									</shadow>
								</value>
							</block>
						</category>
						<category
							colour='20'
							id='catColour'
							name={i18next.t('colors')}
						>
							<block type='colour_picker' />
							<block type='colour_random' />
							<block type='colour_rgb'>
								<value name='RED'>
									<shadow type='math_number'>
										<field name='NUM'>
											100
										</field>
									</shadow>
								</value>
								<value name='GREEN'>
									<shadow type='math_number'>
										<field name='NUM'>
											50
										</field>
									</shadow>
								</value>
								<value name='BLUE'>
									<shadow type='math_number'>
										<field name='NUM'>
											0
										</field>
									</shadow>
								</value>
							</block>
							<block type='colour_blend'>
								<value name='COLOUR1'>
									<shadow type='colour_picker'>
										<field name='COLOUR'>
											#ff0000
										</field>
									</shadow>
								</value>
								<value name='COLOUR2'>
									<shadow type='colour_picker'>
										<field name='COLOUR'>
											#3333ff
										</field>
									</shadow>
								</value>
								<value name='RATIO'>
									<shadow type='math_number'>
										<field name='NUM'>
											0.5
										</field>
									</shadow>
								</value>
							</block>
							<block type='colour_hex_to_decimal'>
								<value name='HEX'>
									<shadow type='colour_picker'>
										<field name='COLOUR'>
											#ff0000
										</field>
									</shadow>
								</value>
							</block>
						</category>
						<sep />
						<category
							colour='330'
							custom='VARIABLE'
							id='catVariables'
							name={i18next.t('variables')}
						/>
						<category
							colour='290'
							id='catFunctions'
							name={i18next.t('functions')}
						>
							<block type='procedures_defnoreturn'>
								<field name='NAME'>
									myFunction
								</field>
							</block>
							<block type='procedures_defreturn'>
								<field name='NAME'>
									myFunction
								</field>
							</block>
							<block type='procedures_deffunctionnoreturn'>
								<field name='NAME'>
									MyFunction
								</field>
							</block>
							<block type='procedures_deffunctionreturn'>
								<field name='NAME'>
									MyFunction
								</field>
							</block>
							<block type='procedures_callclassmethod'>
								<field name="CLASS_NAME">
									java.lang.String
								</field>
								<data>test</data>
							</block>
						</category>
					</xml>
				</div>
				<Portal>
					<Snackbar
						onClose={() => this.showSnackbar(undefined)}
						open={this.state.snackbarMessage}
						autoHideDuration={3000}
						message={this.state.snackbarMessage ? this.state.snackbarMessage : ''}
					/>
				</Portal>
				<Portal>
					<Snackbar
						onClose={() => this.showSuccessSnackbar(undefined)}
						open={this.state.successSnackbarMessage}
						autoHideDuration={3000}
					>
						<Alert
							onClose={() => this.showSuccessSnackbar(undefined)}
							severity='success'
							variant={'filled'}
							sx={{ width: '100%' }}
						>
							{this.state.successSnackbarMessage ? this.state.successSnackbarMessage : ''}
						</Alert>
					</Snackbar>
				</Portal>
				<Portal>
					<Snackbar
						onClose={() => this.showErrorSnackbar(undefined)}
						open={this.state.errorSnackbarMessage}
						autoHideDuration={3000}
					>
						<Alert
							onClose={() => this.showErrorSnackbar(undefined)}
							severity='error'
							variant={'filled'}
							sx={{ width: '100%' }}
						>
							{this.state.errorSnackbarMessage ? this.state.errorSnackbarMessage : ''}
						</Alert>
					</Snackbar>
				</Portal>
				<Backdrop
					sx={{
						color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1
					}}
					open={this.state.buildingProject}
				>
					<div
						style={{
							textAlign: 'center'
						}}
					>
						<CircularProgress color='inherit' />
						<p>Building Project..</p>
					</div>
				</Backdrop>
				<Backdrop
					sx={{
						color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1
					}}
					open={this.state.loadingProject}
				>
					<div
						style={{
							textAlign: 'center'
						}}
					>
						<CircularProgress color='inherit' />
						<p>Loading Project..</p>
					</div>
				</Backdrop>
				<Dialog
					open={this.state.projectBuiltDialogOpen}
					onClose={this.handleCloseProjectBuiltDialog}
					aria-labelledby='alert-dialog-title'
					aria-describedby='alert-dialog-description'
				>
					<DialogTitle id='alert-dialog-title'>
						{'Project Built Successfully'}
					</DialogTitle>
					<DialogContent dividers>
						<DialogContentText id='alert-dialog-description'>
							The project download
							link is only available
							for 10 minutes. You will
							not be able to use it
							afterwards!
						</DialogContentText>
						<div
							style={{
								textAlign: 'center'
							}}
						>
							<QRCode
								value={this.projectDownloadLink}
								size={150}
							/>
						</div>
						<div
							style={{
								textAlign: 'center'
							}}
						>
							<Button
								href={this.projectDownloadLink}
								style={{
									width: '240px', marginTop: '20px'
								}}
								startIcon={<Download />}
								variant={'outlined'}
							>
								Download Extension
							</Button>
						</div>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={this.handleCloseProjectBuiltDialog}
						>
							OK
						</Button>
					</DialogActions>
				</Dialog>
			</Paper>
		</ThemeProvider>) : (<ThemeProvider theme={this.theme}>
			<div
				className={'centered-progress'}
			>
				<CircularProgress />
			</div>
		</ThemeProvider>);
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
						<Folder />
					</Avatar>
				</ListItemAvatar>
				<ListItemText
					primary={this.state.fileSelectedName}
					secondary={this.state.fileSelectedDescription}
				/>
			</ListItem>);
		} else {
			return (<div>
				<p
					style={{
						textAlign: 'center', opacity: '0.7'
					}}
				>
					Selected Projects Appears
					Here..
				</p>
			</div>);
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
			this.showErrorSnackbar('Please enter a name for your project.');
			return;
		}
		if (!this.isClassNameValid(this.state.newProjectDialogProjectName)) {
			this.showErrorSnackbar('Project Name is is an invalid java class name.');
			return;
		}
		if (!this.state.newProjectDialogProjectPackageName || this.state.newProjectDialogProjectPackageName.length === 0) {
			this.showErrorSnackbar('Please enter a package name for your project.');
			return;
		}
		if (!this.isPackageNameValid(this.state.newProjectDialogProjectPackageName)) {
			this.showErrorSnackbar('Package Name is is an invalid java package name.');
			return;
		}
		this.projectManager.newProject({
			name: this.state.newProjectDialogProjectName,
			packageName: this.state.newProjectDialogProjectPackageName,
			description: this.state.newProjectDialogProjectDescription.replaceAll('\n', '<br>') || ''
		}, (statusCode, project) => {
			if (statusCode === 200) {
				console.log(project);
				this.projectToLoad = project;
				this.loadProjects();
				let data = this.state;
				data.projects = undefined;
				data.newProjectDialogProjectName = '';
				data.newProjectDialogProjectDescription = '';
				data.newProjectDialogProjectPackageName = '';
				this.setState(data);
			} else if (statusCode === 409) {
				this.showErrorSnackbar('A project with the same name already exists.');
			} else if (statusCode === 401) {
				this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
			} else {
				this.showErrorSnackbar('The server encountered an error while creating your project. Status Code: ' + statusCode);
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
                                        <ListItemButton disableRipple={this.state.checkedProjects.length > 0}
                                                        onClick={() => {
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

	openProject(project, background, callback) {
		background = background || false;
		let data = this.state;
		if (!background) {
			data.loadingProject = true;
		}
		this.setState(data);
		this.projectManager.loadProjectInformation(project._id, (status, projectBlob) => {
			if (status === 200) {
				this.currentProjectBlob = projectBlob;
				JSZip.loadAsync(projectBlob).then((zip) => {
					return zip.files["extension.json"].async("text");
				}).then((extensionJsonText) => {
					let project_ = JSON.parse(extensionJsonText);
					JSZip.loadAsync(projectBlob).then((zip) => {
						return zip.files["src/main/blocks/" + project_.name + ".xml"].async("text");
					}).then((projectBlocks) => {
						project_.blocks = projectBlocks;
						console.log(project_);
						project_._id = project._id;

						project = project_;
						// unload previous workspace
						if (this.blocklyWorkspace) {
							this.blocklyWorkspace.disposeBlocklyWorkspace();
							this.blocklyWorkspace = null;
						}
						let data = this.state;
						if (!background) {
							data.currentProject = project_;
						}
						console.log(project_);
						this.blocklyWorkspace = new BlocklyWorkspace(project_, this.projectManager, this.userManager.getUser().language);
						console.log(data);
						this.setState(data, () => this.blocklyWorkspace.injectBlocklyWorkspace(() => {
							let newProject = project;
							newProject.blocks = this.blocklyWorkspace.getBlocksXml();
							let data = this.state;
							if (!background) {
								data.currentProject = newProject;
							}
							data.loadingProject = false;
							this.setState(data);
							if (callback) {
								callback(newProject);
							}
						}));
					});
				});
			} else if (status === 401) {
				this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
			} else {
				this.showErrorSnackbar('An error occured while loading your project.');
			}
		});
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
		if (this.getFileExtension(file.name) !== 'rbx') {
			this.showErrorSnackbar('This file isn\'t a project file. Project files are .rbx files.');
		} else {
			let extensionJson;
			JSZip.loadAsync(file)
				.then((content) => {
					// if you return a promise in a "then", you will chain the two promises
					return content.files['extension.json'].async('text');
				})
				.then((extensionJsonContent) => {
					extensionJson = JSON.parse(extensionJsonContent);
					JSZip.loadAsync(file)
						.then((zip) => {
							return zip.files['src/main/blocks/' + extensionJson.name + '.xml'].async('text');
						})
						.then((blocksXml) => {
							extensionJson.blocks = blocksXml;
							if (!import_) {
								console.log(extensionJsonContent);
								const description = extensionJson.description ? extensionJson.description : '';
								let data = this.state;
								data.fileSelected = file;
								data.fileSelectedName = extensionJson.name;
								data.fileSelectedDescription = description;
								this.setState(data);
							} else {
								console.log('Json content: ' + extensionJsonContent);
								console.log('Json ', extensionJson);
								this.projectManager.importProject(extensionJson, (statusCode, project) => {
									if (statusCode === 200) {
										this.projectToLoad = project;
										this.loadProjects();
										let data = this.state;
										data.projects = undefined;
										this.setState(data);
									} else if (statusCode === 409) {
										this.showErrorSnackbar('A project with the same name already exists.');
									} else if (statusCode === 401) {
										this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
									} else {
										this.showErrorSnackbar('The server encountered an error while creating your project. Status Code: ' + statusCode);
									}
								});
								this.handleCloseImportFileDialog();
							}
						});
				});
		}
	}

	getFileExtension(filename) {
		const ext = /^.+\.([^.]+)$/.exec(filename);
		return ext == null ? '' : ext[1];
	}

	handleSaveProjectMenuItem() {
		this.handleProjectMenuClose();
		if (this.projectManager) {
			this.projectManager.updateProject(this.state.currentProject, this.blocklyWorkspace, (status) => {
				if (status === 200) {
					const currentDate = new Date();
					this.showSuccessSnackbar('Project saved at ' + currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear() + ' ' + currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds());
				} else if (status === 401) {
					this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
				} else {
					this.showErrorSnackbar('Failed to save project.');
				}
			});
		}
	}

	openImportClassDialog() {
		this.loadClassesData();
		let data = this.state;
		data.importClassDialogOpen = true;
		this.setState(data);
	}

	loadClassesData(opt_back, opt_filter) {
		opt_back = opt_back || false;
		opt_filter = opt_filter || null;
		if (!opt_back) {
			this.lastFetchedClassesNum = this.lastFetchedClassesNum + 50;
		} else {
			if (this.lastFetchedClassesNum <= 50) {
				return;
			}
			this.lastFetchedClassesNum = this.lastFetchedClassesNum - 50;
		}
		console.log(this.lastFetchedClassesNum);
		let data = {
			min: this.lastFetchedClassesNum - 50 + '', max: this.lastFetchedClassesNum + ''
		};
		if (opt_filter) {
			data.filter = opt_filter;
		}
		$.ajax(BUILD_SERVER_URL + '/classes', {
			type: 'POST', contentType: 'application/json', data: JSON.stringify(data), success: (result) => {
				let parsedResult = JSON.parse(result);
				console.log(parsedResult);
				let data = this.state;
				data.classesData = parsedResult;
				this.setState(data);
			}, error: (xhr) => {
				this.showErrorSnackbar('The BuildServer is temporarily down.');
			}
		});
	}

	handleCloseImportClassDialog() {
		this.lastFetchedClassesNum = 0;
		let data = this.state;
		data.importClassDialogOpen = false;
		data.classesData = undefined;
		this.setState(data);
	}

	buildProject() {
		let data = this.state;
		data.buildingProject = true;
		this.setState(data);
		this.blocklyWorkspace.createProjectFile(this.state.currentProject, (content, project) => {
			const fd = new FormData();
			fd.append('input', content);
			$.ajax({
				type: 'POST', url: BUILD_SERVER_URL + '/build', data: fd, timeout: 15000, processData: false, contentType: false
			})
				.done((data) => {
					const json = JSON.parse(data);
					this.projectDownloadLink = json['downloadUrl'];
					let newState = this.state;
					newState.buildingProject = false;
					newState.projectBuiltDialogOpen = true;
					this.setState(newState);
					console.log(data);
				})
				.fail(() => {
					let newState = this.state;
					newState.buildingProject = false;
					this.setState(newState);
					this.showErrorSnackbar('The BuildServer is temporarily down.');
				});
		});
	}

	isPackageNameValid(packageName) {
		return /(^(?:[a-z_]+(?:\d*[a-zA-Z_]*)*)(?:\.[a-z_]+(?:\d*[a-zA-Z_]*)*)*$)/.test(packageName);
	}

	isClassNameValid(className) {
		return (!/^\d/.test(className) && /^[A-Z][A-Za-z]*$/.test(className));
	}

	handleSaveProjectSettings() {
		let newProject = this.state.currentProject;
		let newDescription = this.state.projectOptionsProjectDescription;
		if (newDescription !== undefined && this.projectSettingChanged('description', newDescription)) {
			newProject.description = newDescription.replaceAll('\n', '<br>');
		}
		let newVersionName = this.state.projectOptionsVersionName;
		if (newVersionName && this.projectSettingChanged('versionName', newVersionName)) {
			newProject.versionName = newVersionName;
		}
		let newVersionNumber = this.state.projectOptionsVersionNumber;
		if (newVersionNumber && this.projectSettingChanged('versionNumber', newVersionNumber)) {
			if (newVersionNumber.trim().length === 0 || !/^\d+$/.test(newVersionNumber)) {
				this.showErrorSnackbar('Invalid Version Number.');
				return;
			}
			newProject.versionNumber = newVersionNumber;
		}
		let newHomePageWebsite = this.state.projectOptionsHomeWebsite;
		if (newHomePageWebsite && this.projectSettingChanged('homeWebsite', newHomePageWebsite)) {
			if (!this.isValidUrl(newHomePageWebsite)) {
				this.showErrorSnackbar('Invalid Home Website.');
				return;
			}
			newProject.homeWebsite = newHomePageWebsite;
		}
		let newMinSdk = this.state.projectOptionsMinSdk;
		if (newMinSdk && this.projectSettingChanged('minSdk', newMinSdk)) {
			newProject.minSdk = newMinSdk.api;
		}
		let newProguard = this.state.projectOptionsProguard;
		console.log(newProguard);
		if (newProguard !== undefined && this.projectSettingChanged('proguard', newProguard)) {
			newProject.proguard = newProguard;
		}
		let newIcon = this.state.projectOptionsIcon;
		console.log(newIcon);
		if (newIcon !== undefined && this.projectSettingChanged('icon', newIcon)) {
			newProject.icon = newIcon;
		}
		console.log(newProject);
		if (newProject) {
			this.projectManager.updateProject(newProject, this.blocklyWorkspace, (status) => {
				console.log(status);
				if (status === 200) {
					let data = this.state;
					data.currentProject = newProject;
					// so we don't use this value in the future.
					data.projectOptionsProjectDescription = newProject.description;
					data.projectOptionsVersionName = newProject.versionName;
					data.projectOptionsVersionNumber = newProject.versionNumber;
					data.projectOptionsHomeWebsite = newProject.homeWebsite;
					data.projectOptionsMinSdk = this.getObjectByApi(newProject.minSdk);
					data.projectOptionsIcon = newProject.icon;
					data.projectOptionsProguard = newProject.proguard;
					this.setState(data, () => {
						this.showSuccessSnackbar('Project Settings Updated.');
						this.handleCloseProjectOptionsDialog();
					});
				} else {
					let data = this.state;
					data.projectOptionsProjectDescription = this.state.currentProject.description;
					data.projectOptionsVersionName = this.state.currentProject.versionName;
					data.projectOptionsVersionNumber = this.state.currentProject.versionNumber;
					data.projectOptionsHomeWebsite = this.state.currentProject.homeWebsite;
					data.projectOptionsMinSdk = this.getObjectByApi(this.state.currentProject.minSdk);
					data.projectOptionsProguard = this.state.currentProject.proguard;
					data.projectOptionsIcon = this.state.currentProject.icon;
					this.setState(data, () => {
						if (status === 409) {
							this.showErrorSnackbar('A project with the same name already exists.');
						} else if (status === 401) {
							this.showErrorSnackbar('Your session has expired. Please reload the webpage and try again.');
						} else {
							this.showErrorSnackbar('Failed to update settings.');
						}
					});
				}
			});
		}
	}

	projectSettingChanged(settingName, value) {
		return (this.state.currentProject[settingName] !== value);
	}

	renderLoadingProject() {
		if (!this.state.projects) {
			return (<tr>
				<td id={'loading-project'}>
					<CircularProgress />
				</td>
			</tr>);
		} else {
			return <div />;
		}
	}

	renderProjectsView() {
		if (!this.state.currentProject) {
			return (<table id={'projects-view'}>
				<tbody>
				{this.renderLoadingProject()}
				<tr
					id='no-projects'
					style={this.state.projects && this.state.projects.length === 0 ? {
						display: 'table-row'
					} : { display: 'none' }}
				>
					<td
						style={{
							textAlign: '-webkit-center'
						}}
					>
						<Lottie
							loop
							animationData={welcomeLottieJson}
							play
							style={{
								width: 250, height: 250, marginBottom: '-51px'
							}}
						/>
						<h3
							style={{
								fontFamily: 'Roboto-Regular'
							}}
						>
							{i18next.t('welcome_to_rapid')}
						</h3>
						<p
							style={{
								fontFamily: 'Roboto-Regular'
							}}
						>
							{i18next.t('no_projects')}
						</p>
						<Button
							onClick={() => this.openNewProjectDialog()}
							variant={'outlined'}
							startIcon={<Add />}
						>
							{i18next.t('create_new_project')}
						</Button>
					</td>
				</tr>
				{this.state.projects && this.state.projects.length !== 0 && this.displayListView()}
				</tbody>
			</table>);
		} else {
			return <div />;
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

	loadClassInfo(className) {
		$.ajax(BUILD_SERVER_URL + '/class', {
			type: 'POST', contentType: 'application/json', data: JSON.stringify({
				name: className
			}), success: (response) => {
				console.log(response);
				this.handleCloseImportClassDialog();
				let classObj = JSON.parse(response);
				this.blocklyWorkspace.importClass(classObj);
			}, error: (error) => {
				console.log(error);
			}
		});
	}

	renderClassesData() {
		if (this.state.classesData) {
			return this.state.classesData.map((item) => (<Grid item xs={6}>
				<Card
					sx={{ minWidth: 275 }}
					variant={'outlined'}
					id={JSON.stringify(item)}
				>
					<CardActionArea>
						<CardContent>
							<div
								style={{
									display: 'flex', verticalAlign: 'middle', marginBottom: '16px', alignItems: 'center'
								}}
							>
								<Avatar
									sx={{
										bgcolor: item.type === 'class' ? 'rgb(62, 143, 160)' : item.type === 'interface' ? 'rgb(64, 125, 65)' : 'rgb(62, 143, 160)',
										width: 60,
										height: 60,
										fontSize: '35px',
										marginRight: '10px'
									}}
								>
									{item.type === 'class' ? 'C' : item.type === 'interface' ? 'I' : 'E'}
								</Avatar>
								<Typography
									noWrap
									variant='h6'
									component='div'
								>
									{item.simpleName}
								</Typography>
							</div>
							<Typography
								noWrap
								sx={{
									fontSize: 14
								}}
								color='text.secondary'
								gutterBottom
							>
								{item.name}
							</Typography>
						</CardContent>
						<CardActions>
							<Button
								onClick={(e) => {
									e.stopPropagation();
									console.log(item);
									this.loadClassInfo(item.name);
								}}
								startIcon={<Upload />}
								size='small'
							>
								Import
							</Button>
						</CardActions>
					</CardActionArea>
				</Card>
			</Grid>));
		} else {
			return (<Grid item xs={6}>
				<CircularProgress
					disableShrink
				/>
			</Grid>);
		}
	}

	isBottom(el) {
		return (el.getBoundingClientRect().bottom <= window.innerHeight);
	}

	handleChangeComplete(color) {
		let data = this.state;
		data.userSettingsThemeColor = color.hex;
		this.setState(data);
	}

	handleOpenColorPicker(event) {
		let data = this.state;
		data.colorPickerAnchorEl = event.currentTarget;
		this.setState(data);
	}

	handleCloseColorPicker() {
		let data = this.state;
		data.colorPickerAnchorEl = null;
		this.setState(data);
	}

	openUploadFile() {
		this.uploadProjectFileInput.click();
		this.uploadProjectFileInput.onchange = () => {
			var fileList = this.uploadProjectFileInput.files;
			console.log(fileList);
			this.projectManager.uploadProjectFile(fileList[0], this.state.currentProject, () => {
				console.log('Upload Done!!');
				let data = this.state;
				data.projectOptionsIcon = fileList[0].name;
				this.setState(data);
			});
		};
	}

	setSortMenuAnchorEl(el, sortEnum) {
		let data = this.state;
		data.sortMenuAnchorEl = el;
		data.sortMenuOpen = Boolean(el);
		if (sortEnum) {
			data.sortBy = sortEnum;
			this.doSortProjects(this.state.projects);
		}
		this.setState(data);
	}

	doSortProjects(projects) {
		let comparator = undefined;
		if (this.state.sortBy === this.sortByEnum.NAME_ASCENDING) {
			comparator = (a, b) => a.name.localeCompare(b.name);
		} else if (this.state.sortBy === this.sortByEnum.NAME_DESCENDING) {
			comparator = (a, b) => b.name.localeCompare(a.name);
		} else if (this.state.sortBy === this.sortByEnum.DATE_CREATED_ASCENDING) {
			comparator = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
		} else if (this.state.sortBy === this.sortByEnum.DATE_CREATED_DESCENDING) {
			comparator = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
		} else if (this.state.sortBy === this.sortByEnum.DATE_MODIFIED_ASCENDING) {
			comparator = (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt);
		} else if (this.state.sortBy === this.sortByEnum.DATE_MODIFIED_DESCENDING) {
			comparator = (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt);
		}
		const sortedProjects = projects.sort(comparator);
		let data = this.state;
		data.projects = sortedProjects;
		this.setState(data);
	}
}

function TabPanel(props) {
	const {
		children, value, index, ...other
	} = props;

	return (<div
		role='tabpanel'
		hidden={value !== index}
		id={`simple-tabpanel-${index}`}
		aria-labelledby={`simple-tab-${index}`}
		{...other}
	>
		{value === index && (<Box sx={{ p: 1.5 }}>
			{children}
		</Box>)}
	</div>);
}

TabPanel.propTypes = {
	children: PropTypes.node, index: PropTypes.number.isRequired, value: PropTypes.number.isRequired
};

export default App;
