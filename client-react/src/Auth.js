import './Auth.scss';
import {Component} from "react";
import firebase from "firebase/compat";
import $ from 'jquery';
import logo from "./logo.png";
import "@mui/material/Button/Button";
import "@mui/material/Checkbox/Checkbox";
import "@mui/material/CircularProgress/CircularProgress";
import "@mui/material/FormControlLabel/FormControlLabel";
import "@mui/material/Snackbar/Snackbar";
import "@mui/material/IconButton/IconButton";
import "@mui/material/TextField/TextField";
import "@mui/material/InputAdornment/InputAdornment";
import "@mui/material/FormGroup/FormGroup";
import {ThemeProvider} from '@mui/material/styles';
import {Visibility, VisibilityOff} from '@mui/icons-material';
import {
    Button,
    Checkbox,
    CircularProgress,
    createTheme, FormControlLabel,
    FormGroup,
    IconButton,
    InputAdornment,
    Snackbar,
    TextField
} from "@mui/material";

const qs = require('query-string');


const API_SERVER_URL = "http://localhost:9980";

class Auth extends Component {
    constructor(props) {
        super(props);
        this.status = {LOADING: "loading", SIGNED_UP: "sign_up", SIGNED_OUT: "signed_out"};
        this.signUpNameInput = undefined;
        this.signUpEmailInput = undefined;
        this.signUpPasswordInput = undefined;
        this.state = {
            signUpName: '',
            signUpEmail: '',
            signUpPassword: '',
            signUp: true,
            signInEmail: '',
            signInPassword: '',
            snackbarMessage: undefined,
            signUpPasswordVisible: false,
            signInPasswordVisible: false,
            status: this.status.LOADING,
        };
    }

    componentDidMount() {
        const firebaseConfig = {
            apiKey: "AIzaSyAJ_KkN5-XXJzdQni3Fkv1HyjnYHPJseaE",
            authDomain: "rapid-client.firebaseapp.com",
            projectId: "rapid-client",
            storageBucket: "rapid-client.appspot.com",
            messagingSenderId: "903527711453",
            appId: "1:903527711453:web:4685fdc673ff5b80481134",
            measurementId: "G-2R6PTZG4YS"
        };

        // Initialize Firebase
        this.firebaseApp = firebase.initializeApp(firebaseConfig);
        this.firebaseApp.auth().onAuthStateChanged((currentUser) => {
            console.log(currentUser);
            if (currentUser) {
                const parsed = qs.parse(window.location.search);
                const callbackUrl = parsed.callback;
                if (callbackUrl) {
                    //window.location.replace(parsed.callback);
                } else {
                    let data = this.state;
                    data.status = this.status.SIGNED_UP;
                    this.setState(data);
                }
            } else {
                let data = this.state;
                data.status = this.status.SIGNED_OUT;
                console.log(data);
                this.setState(data);
            }
        });
    }

    render() {
        const theme = createTheme({
            palette: {
                primary: {
                    main: '#6200ee'
                }
            },
        });
        return (this.state.status === this.status.SIGNED_OUT ? (
                <ThemeProvider theme={theme}>
                    <div>
                        <div style={{display: this.state.signUp ? "inline-grid" : "none"}} className={"signup-form"}>
                            <h3 style={{fonSize: "24px"}}>Sign Up To Rapid </h3>
                            <TextField label="Name" variant="outlined" type={"text"} style={{marginBottom: "20px"}}
                                       onChange={(e) => {
                                           const data = this.state;
                                           data.signUpName = e.target.value;
                                           this.setState(data);
                                       }}/>
                            <TextField label="Email" variant="outlined" type={"email"} style={{marginBottom: "20px"}}
                                       onChange={(e) => {
                                           const data = this.state;
                                           data.signUpEmail = e.target.value;
                                           this.setState(data);
                                       }}/>
                            <TextField label="Password" variant="outlined"
                                       type={this.state.signUpPasswordVisible ? "text" : "password"}
                                       style={{marginBottom: "20px"}}
                                       InputProps={{
                                           endAdornment: <InputAdornment position="end">
                                               <IconButton
                                                   onClick={() => {
                                                       const data = this.state;
                                                       data.signUpPasswordVisible = !data.signUpPasswordVisible;
                                                       this.setState(data);
                                                   }
                                                   }
                                                   edge="end"
                                               >
                                                   {this.state.signUpPasswordVisible ? <Visibility/> : <VisibilityOff/>}
                                               </IconButton>
                                           </InputAdornment>
                                       }} onChange={(e) => {
                                const data = this.state;
                                data.signUpPassword = e.target.value;
                                this.setState(data);
                            }}/>
                            <FormGroup>
                                <FormControlLabel color={"primary"} control={<Checkbox/>} label={<div>
                                    <span>I accept the </span>
                                    <a rel={"noreferrer"} target={"_blank"} href={'/terms'}>terms of use</a>
                                    <span> and </span>
                                    <a rel={"noreferrer"} target={"_blank"} href={'/privacy'}>privacy policy</a>
                                </div>}/>
                            </FormGroup>
                            <Button variant="contained" color="primary" onClick={() => this.doSignUp()}
                                    style={{width: "300px", marginLeft: "40px"}}>
                                Sign Up
                            </Button>
                            <p style={{fontFamily: "Roboto,serif"}}>Already have an account?</p>
                            <u style={{fontFamily: "Roboto,serif", cursor: "pointer"}}
                               onClick={() => {
                                   const data = this.state;
                                   data.signUp = false;
                                   this.setState(data);
                               }} id="already-have-an-account-label">Sign In</u>
                        </div>
                        <div style={{display: !this.state.signUp ? "inline-grid" : "none"}} className={"sign-in-form"}>
                            <h3 style={{fonSize: "24px"}}>Sign In To Rapid</h3>
                            <TextField label="Email" variant="outlined" type={"email"} style={{marginBottom: "20px"}}
                                       onChange={(e) => {
                                           const data = this.state;
                                           data.signInEmail = e.target.value;
                                           this.setState(data);
                                       }}/>
                            <TextField label="Password" variant="outlined"
                                       type={this.state.signInPasswordVisible ? "text" : "password"}
                                       style={{marginBottom: "20px"}}
                                       InputProps={{
                                           endAdornment: <InputAdornment position="end">
                                               <IconButton
                                                   onClick={() => {
                                                       const data = this.state;

                                                       data.signInPasswordVisible = !data.signInPasswordVisible;
                                                       this.setState(data);
                                                   }
                                                   }
                                                   edge="end"
                                               >
                                                   {this.state.signInPasswordVisible ? <Visibility/> : <VisibilityOff/>}
                                               </IconButton>
                                           </InputAdornment>
                                       }} onChange={(e) => {
                                const data = this.state;
                                data.signInPassword = e.target.value;
                                this.setState(data);
                            }}/>
                            <Button variant="contained" color="primary" style={{width: "300px", marginLeft: "40px"}}
                                    onClick={() => this.doSignIn()}>
                                Sign In
                            </Button>
                            <p style={{fontFamily: "Roboto,serif"}}>Don't have an account?</p>
                            <u style={{fontFamily: "Roboto,serif", cursor: "pointer"}}
                               onClick={() => {
                                   const data = this.state;
                                   data.signUp = true;
                                   this.setState(data);
                               }} id="dont-have-an-account-label">Sign In</u>
                        </div>
                        <Snackbar onClose={() => this.showSnackbar(undefined)}
                                  open={!!this.state.snackbarMessage}
                                  autoHideDuration={6000}
                                  message={this.state.snackbarMessage ? this.state.snackbarMessage : ""}/>
                    </div>
                </ThemeProvider>
            ) : (this.state.status === this.status.LOADING ? <ThemeProvider theme={theme}>
                <div className={"centered-progress"}><CircularProgress/></div>
            </ThemeProvider> : <ThemeProvider theme={theme}>
                <div className={"centered-sign-in"}><img style={{width: "120px", height: "120px"}} src={logo}
                                                         alt={"logo"}/><h2>You are Signed In!</h2><p
                    style={{color: "#2d2c2c"}}>You can safely exit this tab.</p></div>
            </ThemeProvider>)
        );
    }

    showSnackbar(message) {
        const data = this.state;
        data.snackbarMessage = message;
        this.setState(data);
    }

    doSignIn() {
        // Validate Inputs
        if (!this.state.signInEmail || this.state.signInEmail.length === 0) {
            this.showSnackbar('Please Enter an email address.');
            return;
        }
        console.log(this.state);
        if (!this.state.signInPassword || this.state.signInPassword.length === 0) {
            this.showSnackbar('Please Enter a password.');
            return;
        }
        // Sign In Using Firebase
        this.firebaseApp.auth().signInWithEmailAndPassword(this.state.signInEmail, this.state.signInPassword)
            .then(() => {
                // Redirect the user to the callback passed in the query parameters, or show a snackbar if the query parameter isn't present.
                const parsed = qs.parse(window.location.search);
                const callbackUrl = parsed.callback;
                if (callbackUrl) {
                    window.location.replace(parsed.callback);
                } else {
                    this.showSnackbar('SignIn Success!');
                }
            })
            .catch((error) => {
                this.showSnackbar(error.message);
            });
    }

    doSignUp() {
        // Validate Inputs
        if (!this.state.signUpEmail || this.state.signUpEmail.length === 0) {
            this.showSnackbar('Please Enter an email address.');
            return;
        }
        if (!this.state.signUpName || this.state.signUpName.length === 0) {
            this.showSnackbar('Please Enter your name.');
            return;
        }
        if (!this.state.signUpPassword || this.state.signUpPassword.length === 0) {
            this.showSnackbar('Please Enter a password.');
            return;
        }
        // Sign Up Using Firebase
        this.firebaseApp.auth().createUserWithEmailAndPassword(this.state.signUpEmail, this.state.signUpPassword)
            .then((userCredential) => {
                const user = userCredential.user;
                // Update user profile with the username
                user.updateProfile({
                    displayName: this.state.signUpName,
                    photoURL: "https://ui-avatars.com/api/?name=" + this.state.signUpName + "&rounded=true"
                }).then(() => {
                    // Register the user authenticated by firebase in the backend database
                    $.ajax({
                        url: API_SERVER_URL + "/user",
                        type: "post",
                        data: JSON.stringify({
                            uid: user.uid,
                            name: user.displayName,
                            email: user.email,
                            photoUrl: user.photoURL
                        }),
                        contentType: "application/json",
                        success: (response) => {
                            console.log(response);
                            // Redirect the user to the callback passed in the query parameters, or show a snackbar if the query parameter isn't present.
                            const parsed = qs.parse(window.location.search);
                            const callbackUrl = parsed.callback;
                            if (callbackUrl) {
                                //window.location.replace(parsed.callback);
                            } else {
                                this.showSnackbar('SignUp Success!');
                            }
                        },
                        error: () => {
                            // if the backend server isn't configured or down, AJAX would fail to
                            this.showSnackbar("The backend server is temporarily down. Please contact the Support Team For More Information.");
                        }
                    });
                });
            })
            .catch((error) => {
                this.showSnackbar(error.message);
            });
    }
}

export default Auth;