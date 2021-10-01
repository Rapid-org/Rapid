# Rapid
An online app to build extensions on the cloud using blocks!

## Building
Rapid are built on multiple parts, the `client`, `buildserver` and `api`.
### Building the Client Module
The client is written in HTML and JS, you could directly run the HTML page `index.html` on your browser.

If you do changes to any of the blockly modules, most essentially the `core`, `blocks`, `msg`, and `generators` modules, you will need to rebuild blockly using
```bash
# cd to the client directory
cd client/
# Install Dependencies
npm install
# Build Blockly
npm run build
```
Note: It's reqiored to have NPM installed on your Device.
### Building & Running the Buildserver Modules
The buildserver modules is written with java, and built using the Gradle build system. To build, use the following command
```bash
# cd to the buildserver directory
cd buildserver
## Build the BuildServer
gradle build
## Run the BuildServer
gradle run
```
Note: It's required to have JDK 8 & Gradle installed on your device.
### Building & Running the API Modules
The API modules is written in NodeJS, you can build it using:
```bash
# cd to the api directory
cd api/
# Install Dependencies
npm install
# Start the API
npm run start
```
Note: It's reqiored to have NPM, NodeJS installed on your Device.
