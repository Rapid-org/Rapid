const mongoose = require('mongoose'),
	Projects = mongoose.model('projects');
Users = mongoose.model('users');
const fs = require('fs');
const admin = require('firebase-admin');
const config = require('./../config');
const JSZip = require('jszip');
const archiver = require('archiver');
const streamBuffers = require('stream-buffers');

exports.list_all_projects = function(req, res) {
	const userId = req.params.id;
	if (!userId) {
		res.status(400).send('No user ID was provided');
		return;
	}
	let token = parseIdToken(req.headers);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, (user) => {
				if (user && (userId === user._id.toString())) {
					Projects.find({ 'userId': userId }, function(err, task) {
						console.log(task);
						if (err) {
							res.send(err);
						} else {
							res.json(task);
						}
					});
				} else {
					res.status(403).json({ error: 'You don\'t have access to this user.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid id token!' });
		}
	});
};

exports.find_project = function(req, res) {
	let token = parseIdToken(req.headers);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, (user) => {
				if (user) {
					Projects.findOne({ _id: req.params.id, userId: user._id.toString() }, (err, task) => {
						if (task) {
							const info = task;
							res.sendFile(config.web.fileStorageLocation + '/' + info._id + '/' + info.name + '.rbx', function(e) {
								if (e) {
									console.log(e);
								} else {
									console.log('File sent!');
								}
							});
						} else {
							res.json(err);
						}
					});
				} else {
					res.status(403).json({ error: 'No user was found with the given ID token.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid id token!' });
		}
	});
};

exports.create_a_project = function(req, res) {
	let token = parseIdToken(req.headers);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, (user) => {
				if (user) {
					Projects.findOne({ name: req.body.name, userId: user._id.toString() }, (err, task) => {
						if (task) {
							res.status(409).send('A project with the same name already exists.');
						} else {
							const new_task = new Projects(req.body);
							new_task.save().then((task, err) => {
								if (err) {
									res.send(err);
								} else {
									// save project on server
									createZipForProject(task, (function(content, err) {
										if (!err) {
											console.log(content);
											doUpdateProject(Buffer.from(content, 'binary'), task._id, task.userId, function(err) {
												if (!err) {
													res.json(task);
												} else {
													// that's a fatal, we created the project but we were not able to save it on our server
													res.json(err);
												}
											});
										} else {
											console.log(err);
											res.status(400).json(err);
										}
									}));
								}
							}).catch((e) => {
								console.log(e);
								res.json({ 'error': `Failed to create new project. Error Stack:\n${e}` });
							});
						}
					});
				} else {
					res.status(403).json({ error: 'You don\'t have access to this project.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid id token!' });
		}
	});
};

exports.import_project = function(req, res) {
	let token = parseIdToken(req.headers);
	const fileBuffer = Buffer.from(req.body);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, (user) => {
				if (user) {
					JSZip.loadAsync(fileBuffer).then((zip) => {
						return zip.files['extension.json'].async('text');
					}).then(function(extensionJson) {
						const extensionObj = JSON.parse(extensionJson);
						JSZip.loadAsync(fileBuffer).then((zip) => {
							return zip.files['src/main/blocks/' + extensionObj.name + '.xml'].async('text');
						}).then(function(blocksXml) {
							console.log(blocksXml);
							extensionObj.blocks = blocksXml;
							console.log('Extension object: ');
							console.log(extensionObj);
							Projects.findOne({ name: extensionObj.name, userId: user._id.toString() }, (err, task) => {
								if (task) {
									res.status(409).send('A project with the same name already exists.');
								} else {
									const new_task = new Projects({
										userId: user._id,
										name: extensionObj.name,
										description: extensionObj.description,
										packageName: extensionObj.packageName
									});
									new_task.save().then((task, err) => {
										if (err) {
											res.send(err);
										} else {
											// save project on server
											createZipForProject(extensionObj, (function(content, err) {
												if (!err) {
													console.log(content);
													doUpdateProject(Buffer.from(content, 'binary'), task._id, task.userId, function(err) {
														if (!err) {
															res.json(task);
														} else {
															// that's a fatal, we created the project but we were not able to save it on our server
															res.json(err);
														}
													});
												} else {
													console.log(err);
													res.status(400).json(err);
												}
											}));
										}
									}).catch((e) => {
										console.log(e);
										res.json({ 'error': `Failed to create new project. Error Stack:\n${e}` });
									});
								}
							});
						});
					});
				} else {
					res.status(403).json({ error: 'You don\'t have access to this project.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid id token!' });
		}
	});
};

exports.delete_project = function(req, res) {
	let token = parseIdToken(req.headers);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, function(user) {
				if (user) {
					getProjectByUser(user, function(project) {
						if (project) {
							const id = req.params.id;
							deleteFolderRecursive(config.web.fileStorageLocation + `/${id}`); // delete the project directory.
							Projects.deleteOne({ _id: id }).then(function() {
								res.json({ 'message': 'Project successfully deleted.' });
							}).catch(function(err) {
								res.json({ 'error': err });
							});
						} else {
							res.status(403).json({ error: 'You don\'t have access to this project.' });
						}
					});
				} else {
					res.status(403).json({ error: 'No user was found with the given ID token.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid Id token.' });
		}
	});
};

var deleteFolderRecursive = function(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file) {
			var curPath = path + '/' + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

function parseIdToken(headers) {
	let token = headers.authorization;
	if (!token) {
		return null;
	}
	return token.replace('Bearer ', '');
}

function getUserUid(token, callback) {
	admin.auth()
		.verifyIdToken(token)
		.then((decodedToken) => {
			const uid = decodedToken.uid;
			callback(uid, null);
		}).catch((error) => {
		callback(null, error);
	});
}

function getUserByUid(uid, callback) {
	Users.findOne({ uid: uid }).then(function(task) {
		if (task) {
			callback(task);
		} else {
			callback(null);
		}
	});
}

function getProjectByUser(user, callback) {
	Projects.findOne({ userId: user._id.toString() }).then(function(task) {
		callback(task);
	});
}

exports.update_project = function(req, res) {
	console.log(req.body);
	const id = req.params.id;
	const name = req.body.name;
	let token = parseIdToken(req.headers);
	var fileBuffer = Buffer.from(req.body);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, function(user) {
				if (user) {
					Projects.findOne({ userId: user._id.toString(), id: id }, function(err, task) {
						console.log(config.web.fileStorageLocation + '/' + id + '/' + task.name + '.rbx');
						if (task.length === 0) {
							res.status(403).send({ error: 'You don\'t have access to this project.' });
						} else {
							if (name) {
								Projects.findOne({ name: task.name, userId: user._id.toString() }).then((task) => {
									if (!task) {
										doUpdateProject(fileBuffer, id, task.userId, (e) => {
											if (e) {
												res.status(400).json(e);
												return;
											}
											res.send(JSON.stringify({ 'message': 'Project successfully updated.' }));
										});
									} else {
										if (task.length > 1) {
											res.status(409).json({ error: 'A project with the same name already exists.' });
										} else {
											doUpdateProject(fileBuffer, id, task.userId, (e) => {
												if (e) {
													res.status(400).json(e);
													return;
												}
												res.send(JSON.stringify({ 'message': 'Project successfully updated.' }));
											});
										}
									}

								});
							} else {
								doUpdateProject(fileBuffer, id, task.userId, (e) => {
									if (e) {
										res.status(400).json(e);
										return;
									}
									res.send(JSON.stringify({ 'message': 'Project successfully updated.' }));
								});
							}
						}
					});
				} else {
					res.status(403).json({ error: 'No user was found with the given ID token.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid id token!' });
		}
	});
};

exports.upload_project_file = function(req, res) {
	console.log(req.body);
	const id = req.params.id;
	const name = req.query.name;
	let token = parseIdToken(req.headers);
	const fileBuffer = Buffer.from(req.body);
	if (!token) {
		res.status(403).json({ error: 'No Credentials Sent!' });
		return;
	}
	getUserUid(token, function(uid, error) {
		if (uid) {
			getUserByUid(uid, function(user) {
				if (user) {
					Projects.findOne({ userId: user._id.toString(), _id: id }, function(err, task) {
						console.log(err);
						console.log(config.web.fileStorageLocation + '/' + id + '/' + task.name + '.rbx');
						if (task.length === 0) {
							res.status(403).send({ error: 'You don\'t have access to this project.' });
						} else {
							if (name) {
								createNewProjectWithFile(fileBuffer, name, task, (content) => {
									if (!content) {
										res.status(400).json(JSON.stringify({ 'error': 'Project update failed.' }));
										return;
									}
									doUpdateProject(content, id, task.userId, (e) => {
										if (e) {
											res.status(400).json(e);
											return;
										}
										res.send(JSON.stringify({ 'message': 'Project successfully updated.' }));
									});
								});
							}
						}
					});
				} else {
					res.status(403).json({ error: 'No user was found with the given ID token.' });
				}
			});
		} else if (error.errorInfo.code === 'auth/id-token-expired') {
			res.status(401).json({ error: 'The ID token has expired!' });
		} else {
			res.status(403).json({ error: 'Invalid id token!' });
		}
	});
};

function createNewProjectWithFile(fileBuffer, fileName, info, callback) {
	console.log(info);
	console.log(fileBuffer);
	console.log(fileName);
	fs.readFile(config.web.fileStorageLocation + '/' + info._id + '/' + info.name + '.rbx', function(err, data) {
		if (!err) {
			JSZip.loadAsync(data).then(function(zip) {
				zip.file(fileName, fileBuffer, { binary: true }).generateAsync({ type: 'nodebuffer' }).then((content) => {
					console.log(content);
					callback(content);
				});
			});
		} else {
			console.log(err);
			callback(undefined);
		}
	});
}

function doUpdateProject(fileBuffer, id, userId, callback) {
	JSZip.loadAsync(fileBuffer).then((content) => {
		return content.files['extension.json'].async('text');
	}).then((txt) => {
		const dirName = config.web.fileStorageLocation + `/${id}`;
		if (!fs.existsSync(dirName)) {
			fs.mkdirSync(dirName);
		}
		var projectName = JSON.parse(txt).name;
		fs.writeFile(dirName + `/${projectName}.rbx`, fileBuffer, (e) => {
			if (!e) {
				Projects.updateOne({_id: id, userId: userId}, {updatedAt: Date.now(), description: JSON.parse(txt).description}, null, (e) => {
					if (!e) {
						callback(null);
					} else {
						callback(e);
					}
				});
			} else {
				console.log(e);
				callback(e);

			}
		});
	});
}

function createZipForProject(project, callback) {
	let outputStreamBuffer = new streamBuffers.WritableStreamBuffer({
		initialSize: (1000 * 1024),   // start at 1000 kilobytes.
		incrementAmount: (1000 * 1024) // grow by 1000 kilobytes each time buffer overflows.
	});

	let archive = archiver('zip', {
		zlib: { level: 9 } // Sets the compression level.
	});
	archive.pipe(outputStreamBuffer);
	const extensionJson = Object.assign({}, project);
	console.log(extensionJson);
	console.log(extensionJson['name']);
	extensionJson['classes'] = (extensionJson['classes']) ? extensionJson['classes'] : [];
	extensionJson['versionName'] = (extensionJson['versionName']) ? extensionJson['versionName'] : '1.0';
	extensionJson['versionNumber'] = (extensionJson['versionNumber']) ? extensionJson['versionNumber'] : 1;
	extensionJson['homeWebsite'] = (extensionJson['homeWebsite']) ? extensionJson['homeWebsite'] : '';
	extensionJson['minSdk'] = (extensionJson['minSdk']) ? extensionJson['minSdk'] : 7;
	extensionJson['name'] = (extensionJson['name']) ? extensionJson['name'] : project._doc.name;
	extensionJson['packageName'] = (extensionJson['packageName']) ? extensionJson['packageName'] : project._doc.packageName;
	extensionJson['description'] = (extensionJson['description']) ? extensionJson['description'] : project._doc.description;
	delete extensionJson._id;
	delete extensionJson.userId;
	delete extensionJson.__v;
	delete extensionJson.$__;
	delete extensionJson.$isNew;
	delete extensionJson._doc;
	delete extensionJson.$errors;
	archive.append(JSON.stringify(extensionJson), { name: 'extension.json' });
	archive.append('<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n  package="com.example"\n  android:versionCode="1"          \n  android:versionName="1.0" >\n  <application>\n    <!-- Define activities, services, and content providers here-->\n  </application>\n</manifest>', { name: 'AndroidManifest.xml' });
	const javaPath = 'src/main/java/' + extensionJson.packageName.replaceAll('.', '/');
	console.log(javaPath);
	archive.directory(javaPath, false);
	// the default project code
	archive.append('\/*\r\n * Copyright (c) 2021, <<Your Name>>\r\n * All rights reserved.\r\n *\r\n * Redistribution and use in source and binary forms, with or without\r\n * modification, are permitted provided that the following conditions are met:\r\n *\r\n * * Redistributions of source code must retain the above copyright notice, this\r\n *   list of conditions and the following disclaimer.\r\n * * Redistributions in binary form must reproduce the above copyright notice,\r\n *   this list of conditions and the following disclaimer in the documentation\r\n *   and\/or other materials provided with the distribution.\r\n *\r\n * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"\r\n * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\r\n * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\r\n * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE\r\n * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR\r\n * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF\r\n * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS\r\n * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN\r\n * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)\r\n * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE\r\n * POSSIBILITY OF SUCH DAMAGE.\r\n *\/\r\npackage io.moha;\r\n\r\nimport com.google.appinventor.components.annotations.DesignerComponent;\r\nimport com.google.appinventor.components.annotations.SimpleFunction;\r\nimport com.google.appinventor.components.annotations.SimpleObject;\r\nimport com.google.appinventor.components.common.ComponentCategory;\r\nimport com.google.appinventor.components.runtime.AndroidNonvisibleComponent;\r\nimport com.google.appinventor.components.runtime.ComponentContainer;\r\n@SimpleObject(external=true)\r\n@DesignerComponent(version = 1, nonVisible = true, category = ComponentCategory.EXTENSION, iconName = "images\/extension.png", description = "", versionName = "1.0")\r\npublic class GrayLetters extends AndroidNonvisibleComponent {\r\n\r\npublic GrayLetters(ComponentContainer container) {\r\n  super(container.$form());\r\n}\r\n  \/**\r\n * Description goes here\r\n *\r\n * @param a\r\n * @param b\r\n * @return double\r\n *\/\r\n  @SimpleFunction\r\n  public double Add(double a, double b) {\r\n    return a + b;\r\n  }\r\n\r\n}\r\n\r\n', { name: javaPath + '/' + project.name + '.java' });
	const blocksPath = 'src/main/blocks/';
	archive.directory(blocksPath, false);
	archive.append((extensionJson['blocks']) ? extensionJson['blocks'] : '<xml xmlns="http:\/\/www.w3.org\/1999\/xhtml">\r\n  <block type="procedures_deffunctionreturn" x="356" y="219">\r\n    <mutation>\r\n      <arg name="a" type="Number"><\/arg>\r\n      <arg name="b" type="Number"><\/arg>\r\n    <\/mutation>\r\n    <field name="NAME">Add<\/field>\r\n    <field name="PROCEDURE_RETURN_TYPE">NUMBER<\/field>\r\n    <value name="RETURN">\r\n      <block type="math_arithmetic">\r\n        <field name="OP">ADD<\/field>\r\n        <value name="A">\r\n          <shadow type="math_number">\r\n            <field name="NUM">1<\/field>\r\n          <\/shadow>\r\n          <block type="variables_get">\r\n            <field name="VAR">a<\/field>\r\n          <\/block>\r\n        <\/value>\r\n        <value name="B">\r\n          <shadow type="math_number">\r\n            <field name="NUM">1<\/field>\r\n          <\/shadow>\r\n          <block type="variables_get">\r\n            <field name="VAR">b<\/field>\r\n          <\/block>\r\n        <\/value>\r\n      <\/block>\r\n    <\/value>\r\n  <\/block>\r\n<\/xml>', { name: blocksPath + '/' + project.name + '.xml' });
	archive.finalize();
	outputStreamBuffer.on('finish', () => {
		// Do something with the contents here
		outputStreamBuffer.end();
		callback(outputStreamBuffer.getContents(), null);
	});
}