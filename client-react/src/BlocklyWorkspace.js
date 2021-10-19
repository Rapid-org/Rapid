import Blockly from './blockly/blockly_compressed';
import './blockly/blocks_compressed';
import './en';
import './blockly/closure/goog/base';
import './blockly/java_compressed';
import JSZip from 'jszip';
import firebase from "firebase/compat";

let workspace;
let project;

class BlocklyWorkspace {
    constructor(project_, projectManager) {
        console.log(project_);
        project = project_;
        this.projectManager = projectManager;
    }

    injectBlocklyWorkspace() {
        workspace = Blockly.inject('project-view', {
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
            media: 'media/',
            trashcan: true
        });
        console.log(project);
        const xmlText = project.blocks;
        if (xmlText) {
            const xml = Blockly.Xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(workspace, xml);
        }
        // don't show
        window.oncontextmenu = function (e) {
            if (!Blockly.isTargetInput_(e)) {
                e.preventDefault();
            }
        };
        workspace.addChangeListener(() => {
            // Show a warning for non-top-level blocks placed outside a parent.
            const newBlocks = workspace.getAllBlocks();
            if (this.blocks !== newBlocks) {
                this.blocks = newBlocks;
                for (let blockIndex in this.blocks) {
                    const block = this.blocks[blockIndex];
                    if (!block.parentBlock_ && !block.isTopLevel && !block.warning) {
                        block.setWarningText(Blockly.Msg["WARNING_BLOCK_WITHOUT_PARENT"]);
                    } else if (block.parentBlock_ && block.warning && block.warning.text_[""] === Blockly.Msg["WARNING_BLOCK_WITHOUT_PARENT"]) {
                        block.setWarningText(null);
                    }
                }
                // save the changes
                const xmlDom = Blockly.Xml.workspaceToDom(workspace);
                project.blocks = Blockly.Xml.domToPrettyText(xmlDom);
                console.log(project);
                this.projectManager.updateProject(project);
            }
        });
    }

    disposeBlocklyWorkspace() {
        if (workspace) {
            workspace.dispose();
            const toolboxDiv = document.getElementsByClassName("blocklyToolboxDiv")[0];
            if (toolboxDiv) {
                toolboxDiv.remove();
            }
            workspace = undefined;
        }
    }

    generateJavaCode() {
        if (!workspace) {
            // create an invisible workspace for resolving the java code
            this.injectBlocklyWorkspace();
        }
        workspace.options.appTitle = project['name'];
        Blockly.Java.setPackage(project['packageName']);
        Blockly.Java.setDescription(project["description"]);
        Blockly.Java.setVersionName(project["versionName"]);
        Blockly.Java.setVersionNumber(project["versionNumber"]);
        Blockly.Java.setHomeWebsite(project["homeWebsite"]);
        Blockly.Java.setMinSdk(project['minSdk']);
        return Blockly.Java.workspaceToCode(workspace);
    }


    createProjectFile(project, callback) {
        const zip = new JSZip();
        const sourceDirectory = "src/main/java/" + project['packageName'].replaceAll(".", "/");
        const blocksDirectory = "src/main/blocks";
        // holds the extension information, parsed in the buildserver or when importing a project
        let extensionJson = project;
        // remove unneeded/private information
        delete extensionJson._id; // project id
        delete extensionJson.userId; // user id
        delete extensionJson.__v; // document revision key
        zip.file("extension.json", JSON.stringify(project));
        zip.file("AndroidManifest.xml", decodeURIComponent(project['androidManifest']));
        zip.folder(sourceDirectory);
        zip.folder(blocksDirectory);
        const code = this.generateJavaCode();
        zip.file(sourceDirectory + "/" + project['name'] + ".java", code);
        const xmlDom = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
        zip.file(blocksDirectory + "/" + project['name'] + ".xml", xmlText);
        zip.generateAsync({type: "blob"}).then(function (content) {
            callback(content, project);
        });
    };
}

export default BlocklyWorkspace;