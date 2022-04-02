import Blockly from './blockly/blockly_compressed';
import './blockly/blocks_compressed';
import './blockly/closure/goog/base';
import './blockly/java_compressed';
import JSZip from 'jszip';
import $ from "jquery";

/**
 * @type {Blockly.WorkspaceSvg}
 */
let workspace;
let project;
let language;

class BlocklyWorkspace {

    constructor(project_, projectManager, language_) {
        console.log(project_);
        project = project_;
        language = language_;
        this.projectManager = projectManager;
    }

    updateToolboxCategories() {
        let toolbox = $('#toolbox');
        let projectClasses = project.classes;
        console.log(projectClasses);
        console.log(projectClasses && projectClasses.length !== 0);
        if (projectClasses && projectClasses.length !== 0) {
            for (let classIndex in projectClasses) {
                let classObj = projectClasses[classIndex];
                console.log(classIndex);
                console.log(classObj);
                if (classIndex === 0) {
                    toolbox.append('<sep></sep>');
                }
                toolbox.append(`<category colour="120" id="cat${classObj.displayName}" name="${classObj.displayName}"></category>`);
                let constructors = classObj.constructors;
                for (let constructorIndex in constructors) {
                    let constructor = constructors[constructorIndex];
                    let params = constructor.params;
                    let constructorName = 'Create' + constructorIndex;
                    console.log(constructor.description);
                    Blockly.Blocks[constructorName] = {
                        init: function () {
                            this.setColour(230);
                            this.setTooltip(constructor.description);
                            this.setHelpUrl('');
                            this.setPreviousStatement(true);
                            this.setNextStatement(true);
                            this.appendDummyInput()
                                .appendField('Create');
                            this.setOutput(true, translateToBlockly(classObj.name));
                            this.class = classObj;
                            for (let paramIndex in params) {
                                let param = params[paramIndex];
                                console.log('Blockly type', translateToBlockly(param.type))
                                this.appendValueInput('PARAM-' + paramIndex)
                                    .setAlign(Blockly.ALIGN_RIGHT)
                                    .appendField(param.name, 'ARGn' + paramIndex)
                                    .setCheck(translateToBlockly(param.type));
                            }
                            this.arguments_ = params;
                        }
                    };

                    Blockly.Java[constructorName] = function (block) {
                        Blockly.Java.addImport(block.class.name);
                        const args = [];
                        for (let x = 0; x < block.arguments_.length; x++) {
                            args[x] = Blockly.Java.valueToCode(block, 'PARAM-' + x,
                                Blockly.Java.ORDER_NONE) || 'null';
                        }
                        console.log(args);
                        return ['new ' + block.class.simpleName + '(' + args.join(', ') + ')', Blockly.Java.ORDER_FUNCTION_CALL];
                    };
                    const block_name = constructorName;
                    const block_categoryName = classObj.displayName;

                    let xml;
                    xml = '<block type=' + block_name + '></block>';
                    toolbox.find("[name='" + block_categoryName + "']").append(xml);
                }
                let methods = classObj.methods;
                for (let methodIndex in methods) {
                    let method = methods[methodIndex];
                    let params = method.params;
                    let methodName = method.name + generateUUID();
                    console.log(method.description);
                    Blockly.Blocks[methodName] = {
                        init: function () {
                            this.setColour(230);
                            this.setTooltip(method.description);
                            this.setHelpUrl('');
                            this.setPreviousStatement(true);
                            this.setNextStatement(true);
                            this.appendDummyInput()
                                .appendField(method.name);
                            let returnType = method.type;
                            if (returnType !== "void") {
                                this.setOutput(true, translateToBlockly(returnType));
                            }
                            let isStatic = method.isStatic;
                            if (!isStatic) {
                                this.appendValueInput('PARAM-INSTANCE')
                                    .setAlign(Blockly.ALIGN_RIGHT)
                                    .appendField('instance', 'ARGnInstance')
                                    .setCheck(translateToBlockly(classObj.name));
                            }
                            this.class = classObj;
                            this.isStatic = isStatic;
                            for (let paramIndex in params) {
                                let param = params[paramIndex];
                                console.log('Blockly type', translateToBlockly(param.type))
                                this.appendValueInput('PARAM-' + paramIndex)
                                    .setAlign(Blockly.ALIGN_RIGHT)
                                    .appendField(param.name, 'ARGn' + paramIndex)
                                    .setCheck(translateToBlockly(param.type));
                            }
                            this.arguments_ = params;
                        }
                    };

                    Blockly.Java[methodName] = function (block) {
                        Blockly.Java.addImport(block.class.name);
                        const args = [];
                        for (let x = 0; x < block.arguments_.length; x++) {
                            args[x] = Blockly.Java.valueToCode(block, 'PARAM-' + x,
                                Blockly.Java.ORDER_NONE) || 'null';
                        }
                        console.log(args);
                        let classOrInstance;
                        console.log(block.class);
                        if (block.isStatic) {
                            classOrInstance = block.class.simpleName;
                        } else {
                            classOrInstance = Blockly.Java.valueToCode(block, 'PARAM-INSTANCE',
                                Blockly.Java.ORDER_NONE) || 'null';
                        }
                        console.log(classOrInstance);
                        console.log(classOrInstance + "." + method.name + '(' + args.join(', ') + ')');
                        return [classOrInstance + "." + method.name + '(' + args.join(', ') + ')', Blockly.Java.ORDER_FUNCTION_CALL];
                    };

                    const block_name = methodName;
                    const block_categoryName = classObj.displayName;

                    let xml;
                    xml = '<block type=' + block_name + '></block>';
                    toolbox.find("[name='" + block_categoryName + "']").append(xml);
                }

                function translateToBlockly(javaClass) {
                    console.log('java class', javaClass);
                    if (javaClass === 'java.lang.String') {
                        return 'String';
                    }
                    if (javaClass === 'int' || javaClass === 'double' || javaClass === 'long' || javaClass === 'java.lang.Double' || javaClass === 'java.lang.Integer' || javaClass === 'java.lang.Long') {
                        return 'Number';
                    }
                    if (javaClass === 'boolean' || javaClass === 'java.lang.Boolean') {
                        return 'Boolean';
                    }
                    if (javaClass === 'YailList' || javaClass.includes('[') || javaClass.includes('ArrayList')) {
                        return 'Array';
                    }
                    return javaClass;
                }

                function generateUUID() { // Public Domain/MIT
                    var d = new Date().getTime(); //Timestamp
                    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
                    return 'xxxxxx'.replace(/[xy]/g, function (c) {
                        var r = Math.random() * 16; //random number between 0 and 16
                        if (d > 0) { //Use timestamp until depleted
                            r = (d + r) % 16 | 0;
                            d = Math.floor(d / 16);
                        } else { //Use microseconds since page-load if supported
                            r = (d2 + r) % 16 | 0;
                            d2 = Math.floor(d2 / 16);
                        }
                        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                    });
                }
            }
        }
        workspace.updateToolbox(document.getElementById('toolbox'));
    }

    injectBlocklyWorkspace(callback) {
        if (language === "en") {
            import('./en').then(() => {
                console.log("English Imported");
                this.doInjectBlocklyWorkspace(callback);
            });
        } else {
            import('./ar').then(() => {
                console.log("Arabic Imported");
                this.doInjectBlocklyWorkspace(callback);
            });
        }
    }

    doInjectBlocklyWorkspace(callback) {
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
        this.updateToolboxCategories();
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
                    const returnType = block.getFieldValue('PROCEDURE_RETURN_TYPE');
                    const returnInput = block.getInputTargetBlock('RETURN');
                    if (returnType && returnInput) {
                        const type = returnInput.outputConnection.check_;
                        console.log('Type', type);
                        console.log('Return type', returnType);
                        if (type) {
                            const blockType = getBlocklyType(type[0]);
                            console.log('Block Type', blockType);
                            if (returnType.toUpperCase() !== blockType.toUpperCase()) {
                                block.setWarningText("The return type doesn't match the return value.")
                            } else {
                                block.setWarningText(null);
                            }
                        }
                    }
                }
                // save the changes
                const xmlDom = Blockly.Xml.workspaceToDom(workspace);
                project.blocks = Blockly.Xml.domToPrettyText(xmlDom);
                console.log(project);
                if (this.projectManager) {
                    this.projectManager.updateProject(project, this, callback);
                }
            }
        });

        function getBlocklyType(type) {
            if (type) {
                type = type.toLowerCase();
                if (type === 'string') {
                    return 'String';
                }
                if (type === 'number') {
                    return 'Number';
                }
                if (type === 'array') {
                    return 'Array';
                }
                if (type === 'colour') {
                    return 'String';
                }
                if (type === 'boolean') {
                    return 'Boolean';
                }
                return null;
            } else {
                return null;
            }
        }
    }

    getBlocksXml() {
        const xmlDom = Blockly.Xml.workspaceToDom(workspace);
        return Blockly.Xml.domToPrettyText(xmlDom);
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

    generateJavaCode(callback) {
        if (!workspace) {
            // create an invisible workspace for resolving the java code
            this.injectBlocklyWorkspace(() => {
                this.generateJavaCode(callback);
            });
        } else {
            console.log("Export project: " + JSON.stringify(project));
            workspace.options.appTitle = project.name;
            Blockly.Java.setPackage(project.packageName);
            Blockly.Java.setDescription(project.description);
            Blockly.Java.setVersionName(project.versionName);
            Blockly.Java.setVersionNumber(project.versionNumber);
            Blockly.Java.setHomeWebsite(project.homeWebsite);
            Blockly.Java.setMinSdk(project.minSdk);
            callback(Blockly.Java.workspaceToCode(workspace));
        }
    }


    createProjectFile(project, callback) {
        console.log(project);
        const zip = new JSZip();
        const sourceDirectory = "src/main/java/" + project.packageName.replaceAll(".", "/");
        const blocksDirectory = "src/main/blocks";
        // holds the extension information, parsed in the buildserver or when importing a project
        let extensionJson = Object.assign({}, project);
        console.log(extensionJson);
        // remove unneeded/private information
        delete extensionJson._id; // project id
        delete extensionJson.userId; // user id
        delete extensionJson.__v; // document revision key
        delete extensionJson.blocks; // project blocks ( they are available as src/main/blocks/Name.xml )
        delete extensionJson.androidManifest; // project manifest ( they are available as AndroidManifest.xml )
        zip.file("extension.json", JSON.stringify(extensionJson));
        zip.file("AndroidManifest.xml", decodeURIComponent(extensionJson['androidManifest']));
        zip.folder(sourceDirectory);
        zip.folder(blocksDirectory);
        this.generateJavaCode((code) => {
            zip.file(sourceDirectory + "/" + extensionJson['name'] + ".java", code);
            const xmlDom = Blockly.Xml.workspaceToDom(workspace);
            const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
            zip.file(blocksDirectory + "/" + extensionJson['name'] + ".xml", xmlText);
            zip.generateAsync({ type: "blob" }).then(function (content) {
                callback(content, project);
            });
        });
    }

    importClass(classObj) {
        let newProject = Object.assign({}, project);
        let newProjectClasses = newProject.classes;
        let classDisplayName = classObj.simpleName;
        let duplicateNumber = 1;
        for (let i = 0; i < newProjectClasses.length; i++) {
            let classSimpleName = newProjectClasses[i].simpleName;
            if (classSimpleName === classDisplayName) {
                duplicateNumber++;
            }
        }
        classDisplayName = classDisplayName + duplicateNumber;
        classObj.displayName = classDisplayName;
        newProjectClasses.push(classObj);
        console.log(newProjectClasses);
        this.projectManager.updateProject(newProject, this, (status) => {
            console.log(status);
        });
        this.updateToolboxCategories();
    }

    updateWorkspaceBlocks(newBlocks) {
        console.log(newBlocks);
        workspace.clear();
        const xml = Blockly.Xml.textToDom(newBlocks);
        Blockly.Xml.domToWorkspace(workspace, xml);
    }
}

export default BlocklyWorkspace;