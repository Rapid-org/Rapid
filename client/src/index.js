import React from 'react';
import './index.css';
import App from './App';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Auth from './Auth';
import Privacy from './Privacy';
import './i18nextInit.js';
import NotFound from './NotFound';
import Account from './Account';

ReactDOM.render(<React.StrictMode>
	<Router>
		<Route exact path={['/client', '/']} component={App} />
		<Route exact path='/auth' component={Auth} />
		<Route exact path='/privacy' component={Privacy} />
		<Route exact path='/account' component={Account} />
	</Router>
</React.StrictMode>, document.getElementById('root'));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
