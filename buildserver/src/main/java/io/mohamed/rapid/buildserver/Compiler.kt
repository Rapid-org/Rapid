package io.mohamed.rapid.buildserver

import com.android.tools.r8.*
import com.android.tools.r8.origin.Origin
import com.google.appinventor.components.scripts.*
import org.apache.commons.io.FileUtils
import org.apache.commons.io.IOUtils
import org.json.JSONArray
import org.json.JSONObject
import org.w3c.dom.Element
import org.w3c.dom.Node
import org.xml.sax.InputSource
import org.xml.sax.SAXException
import org.zeroturnaround.zip.ZipUtil
import java.io.*
import java.net.URI
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.util.*
import java.util.jar.Attributes
import java.util.jar.JarOutputStream
import java.util.jar.Manifest
import java.util.zip.ZipEntry
import javax.tools.*
import javax.tools.Diagnostic
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.parsers.ParserConfigurationException
import kotlin.math.roundToInt

class Compiler private constructor(
    propertiesObj: JSONObject, private val code: String, private val userErrors: PrintWriter,
    private val androidManifestXml: String
) {
    private val generatedClasses = ArrayList<String>()
    private val packageName: String = propertiesObj.getString("packageName")
    private var projectName: String? = null
    private var proguard = false
    private fun compileSourceFiles(classesDir: File): Boolean {
        return try {
            val compiler = ToolProvider.getSystemJavaCompiler()
            val diagnostics = DiagnosticCollector<JavaFileObject>()
            val file: JavaFileObject = JavaSource(projectName, code)
            val compilationUnits: Iterable<JavaFileObject> = listOf(file)
            val options: List<String> = ArrayList(
                listOf(
                    "-classpath",
                    System.getProperty("java.class.path"),
                    "-target",
                    "1.7",
                    "-source",
                    "1.7",
                    "-d",
                    classesDir.absolutePath
                )
            )
            val task = compiler.getTask(null, null, diagnostics, options, null, compilationUnits)
            task.setProcessors(
                listOf(
                    ComponentDescriptorGenerator(),
                    ComponentListGenerator(),
                    ComponentTranslationGenerator(),
                    MarkdownDocumentationGenerator()
                )
            )
            val success = task.call()
            for (diagnostic in diagnostics.diagnostics) {
                // TODO: Simplify the errors for a non java user.
                if (diagnostic.kind == Diagnostic.Kind.ERROR) { // ignore java warnings,
                    // they are not useful when dealing with blockly
                    userErrors.println(diagnostic) // an error occurred while compiling source files.
                }
            }
            success
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun proguardSourceFiles(filesDirectory: File): Boolean {
        return try {
            val outJar = File(filesDirectory, "AndroidRuntime_p.jar")
            val inJar = File(filesDirectory, "AndroidRuntime.jar")
            val configuration = """-verbose
-dontwarn
-dontnote **
-optimizationpasses 3
-allowaccessmodification
-dontskipnonpubliclibraryclasses
-mergeinterfacesaggressively
-overloadaggressively
-useuniqueclassmembernames
-repackageclasses ''

-keep public class * {
    public protected *;
}"""
            val configurationLines: Array<String> =
                configuration.split("\n".toRegex()).toTypedArray()
            val proguardFile = File(filesDirectory, "proguard.cfg")
            Files.write(proguardFile.toPath(), listOf(*configurationLines))
            R8.run(
                R8Command.parse(
                    arrayOf(
                        "--release",
                        "--classfile",
                        "--output",
                        outJar.absolutePath,
                        "--pg-conf",
                        proguardFile.absolutePath,
                        inJar.absolutePath
                    ),
                    Origin.root()
                )
                    .build()
            )
            inJar.delete()
            outJar.renameTo(inJar)
            true
        } catch (e: Exception) {
            val sw = StringWriter()
            val pw = PrintWriter(sw)
            e.printStackTrace(pw)
            userErrors.println(sw)
            false
        }
    }

    @Throws(ParserConfigurationException::class, IOException::class, SAXException::class)
    private fun parseAndroidManifest(classesDir: File): Boolean {
        val factory = DocumentBuilderFactory.newInstance()
        factory.isValidating = false
        val builder = factory.newDocumentBuilder()
        val `is` = InputSource(StringReader(androidManifestXml))
        println(androidManifestXml)
        val document = builder.parse(`is`)
        val rootElement = document.documentElement
        val activitiesArray = getActivities(rootElement)
        val receiversArray = getReceivers(rootElement)
        val providersArray = getProviders(rootElement)
        val servicesArray = getServices(rootElement)
        val permissionsArray = getPermissions(rootElement)
        println(permissionsArray)
        val simpleComponentsBuildInfoFile =
            File(classesDir.absolutePath, "simple_components_build_info.json")
        val buildInfoJsonString = IOUtils
            .toString(FileInputStream(simpleComponentsBuildInfoFile), StandardCharsets.UTF_8)
        println(buildInfoJsonString)
        val buildInfoJsonArray = JSONArray(buildInfoJsonString)
        val buildInfoJsonObject = buildInfoJsonArray.getJSONObject(0)
        buildInfoJsonObject.put("activities", activitiesArray)
        buildInfoJsonObject.put("contentProviders", providersArray)
        buildInfoJsonObject.put("broadcastReceivers", receiversArray)
        buildInfoJsonObject.put("services", servicesArray)
        buildInfoJsonObject.put("permissions", permissionsArray)
        buildInfoJsonArray.put(buildInfoJsonObject)
        val writer = FileWriter(simpleComponentsBuildInfoFile)
        writer.write(buildInfoJsonArray.toString())
        writer.close()
        return true
    }

    private fun getActivities(rootElement: Element): JSONArray {
        val array = JSONArray()
        val activitiesNodes = rootElement.getElementsByTagName("activity")
        var buffer: StringBuffer
        for (i in 0 until activitiesNodes.length) {
            val permissionNode = activitiesNodes.item(i)
            buffer = StringBuffer()
            getXMLString(permissionNode, true, buffer, true)
            array.put(buffer.toString())
        }
        return array
    }

    private fun getReceivers(rootElement: Element): JSONArray {
        val array = JSONArray()
        val nodes = rootElement.getElementsByTagName("receiver")
        var buffer: StringBuffer
        for (i in 0 until nodes.length) {
            val permissionNode = nodes.item(i)
            buffer = StringBuffer()
            getXMLString(permissionNode, true, buffer, true)
            array.put(buffer.toString())
        }
        return array
    }

    private fun getProviders(rootElement: Element): JSONArray {
        val array = JSONArray()
        val providerNodes = rootElement.getElementsByTagName("provider")
        var buffer: StringBuffer
        for (i in 0 until providerNodes.length) {
            val permissionNode = providerNodes.item(i)
            buffer = StringBuffer()
            getXMLString(permissionNode, true, buffer, true)
            array.put(buffer.toString())
        }
        return array
    }

    private fun getServices(rootElement: Element): JSONArray {
        val array = JSONArray()
        val serviceNodes = rootElement.getElementsByTagName("service")
        var buffer: StringBuffer
        for (i in 0 until serviceNodes.length) {
            val permissionNode = serviceNodes.item(i)
            buffer = StringBuffer()
            getXMLString(permissionNode, true, buffer, true)
            array.put(buffer.toString())
        }
        return array
    }

    private fun getPermissions(rootElement: Element): JSONArray {
        val array = JSONArray()
        val permissionNodes = rootElement.getElementsByTagName("uses-permission")
        for (i in 0 until permissionNodes.length) {
            val permissionNode = permissionNodes.item(i)
            array.put(
                permissionNode.attributes.getNamedItem("android:name")
                    .nodeValue
            )
        }
        return array
    }

    private fun packExtension(
        extensionsDirectory: File,
        outputDirectory: File,
        externalComponents: File,
        dexDirectory: File,
        filesDirectory: File
    ): Boolean {
        return try {
            val outputPackageDirectory = File(extensionsDirectory, packageName)
            FileUtils.copyDirectory(externalComponents, extensionsDirectory)
            FileUtils.copyFile(
                File(dexDirectory, "classes.jar"), File(outputPackageDirectory, "classes.jar")
            )
            FileUtils.copyFile(
                File(filesDirectory, "AndroidRuntime.jar"),
                File(File(outputPackageDirectory, "files"), "AndroidRuntime.jar")
            )
            ZipUtil.pack(extensionsDirectory, File(outputDirectory, "$packageName.aix"))
            true
        } catch (e: IOException) {
            e.printStackTrace()
            false
        }
    }

    private fun runD8(dexDirectory: File): Boolean {
        return try {
            val argumentsFile = File.createTempFile("argfile", ".txt")
            val classes = ArrayList(generatedClasses)
            Files.write(argumentsFile.toPath(), classes, StandardCharsets.UTF_8)
            D8.run(
                D8Command.parse(
                    arrayOf(
                        "--output",
                        File(dexDirectory, "classes.jar").absolutePath,
                        "@" + argumentsFile.absolutePath
                    ),
                    Origin.root()
                )
                    .build()
            )
            true
        } catch (e: CompilationFailedException) {
            e.printStackTrace()
            false
        } catch (e: IOException) {
            e.printStackTrace()
            false
        }
    }

    private fun generateExtensions(
        filesDirectory: File,
        externalComponentDirectory: File,
        depsDirectory: File,
        classesDirectory: File
    ): Boolean {
        return try {
            val simpleComponentsFile = File(classesDirectory.absolutePath, "simple_components.json")
            val simpleComponentsBuildInfoFile =
                File(classesDirectory.absolutePath, "simple_components_build_info.json")
            ExternalComponentGenerator.main(
                arrayOf(
                    simpleComponentsFile.absolutePath,
                    simpleComponentsBuildInfoFile.absolutePath,
                    externalComponentDirectory.absolutePath,
                    classesDirectory.absolutePath,
                    depsDirectory.absolutePath,
                    filesDirectory.absolutePath,
                    "false"
                )
            )
            true
        } catch (e: Exception) {
            e.printStackTrace()
            userErrors.println(e)
            false
        }
    }

    private fun jarExtension(classesDirectory: File, filesDirectory: File): Boolean {
        val fileOutputStream: FileOutputStream
        return try {
            fileOutputStream = FileOutputStream(File(filesDirectory, "AndroidRuntime.jar"))
            val manifest = Manifest()
            manifest.mainAttributes[Attributes.Name.MANIFEST_VERSION] = "1.0"
            val jarOut = JarOutputStream(fileOutputStream, manifest)
            for (file in generatedClasses) {
                val relativePath = classesDirectory.toURI().relativize(File(file).toURI()).path
                jarOut.putNextEntry(ZipEntry(relativePath))
                jarOut.write(
                    IOUtils.toByteArray(FileInputStream(File(classesDirectory, relativePath)))
                )
            }
            jarOut.closeEntry()
            jarOut.close()
            fileOutputStream.close()
            true
        } catch (e: IOException) {
            e.printStackTrace()
            false
        }
    }

    private fun findGeneratedClasses(rootDirectory: File) {
        if (rootDirectory.listFiles() != null) {
            for (file in Objects.requireNonNull(rootDirectory.listFiles())) {
                if (file.isDirectory) {
                    findGeneratedClasses(file)
                } else if (file.name
                        .endsWith(".class")
                ) { // collect class files only to dex afterwards
                    generatedClasses.add(file.absolutePath)
                }
            }
        }
    }

    companion object {
        @Throws(ParserConfigurationException::class, IOException::class, SAXException::class)
        fun compile(
            extensionDirectory: File?,
            propertiesObj: JSONObject,
            code: String,
            androidManifestXml: String,
            userErrors: PrintWriter,
            userMessages: PrintWriter, iconName: File
        ): Boolean {
            val compiler = Compiler(propertiesObj, code, userErrors, androidManifestXml)
            compiler.projectName = propertiesObj.getString("name")
            compiler.proguard = propertiesObj.getBoolean("proguard")
            if (compiler.projectName == null) {
                userErrors.println("Invalid extension properties file.")
                println("[ERROR] Invalid extension properties file.")
                return false
            }
            val start = System.currentTimeMillis()
            println("[INFO] Building " + compiler.projectName)
            userMessages.println("Building " + compiler.projectName)
            println("[INFO] Compiling Source Files..")
            userMessages.println("_______Compiling Project Source Files..")
            val classesDir = File(extensionDirectory, "classes")
            if (!classesDir.mkdir()) {
                println("[ERROR] Failed to create classes directory")
                return false
            }
            if (!compiler.compileSourceFiles(classesDir)) {
                println("[ERROR] Compile source files failed.")
                userErrors.println("Failed to compile project source.")
                return false
            }
            compiler.findGeneratedClasses(classesDir)
            userMessages.println("Parsing Android Manifest..")
            if (!compiler.parseAndroidManifest(classesDir)) {
                println("[ERROR] Parsing Android Manifest Failed.")
                userErrors.println("Failed to parse android manifest.")
                return false
            }
            println("[INFO] Creating JAR file for Extension")
            userMessages.println("_______Creating JAR file for Project")
            val filesDir = File(extensionDirectory, "files")
            if (!filesDir.mkdir()) {
                println("[ERROR] Failed to create files directory")
                return false
            }
            if (!compiler.jarExtension(classesDir, filesDir)) {
                userErrors.println("Failed to jar extensions.")
                return false
            }
            if (compiler.proguard) {
                println("[INFO] Invoking R8..")
                userMessages.println("_______Proguarding Source Files..")
                if (!compiler.proguardSourceFiles(filesDir)) {
                    userErrors.println("Failed to proguard extensions.")
                    return false
                }
            }
            println("[INFO] Generating Extensions")
            userMessages.println("_______Generating Extensions")
            val externalComponents = File(extensionDirectory, "externalComponents")
            if (!externalComponents.mkdir()) {
                println("[ERROR] Failed to create external components directory")
                return false
            }
            // copy icons so they can be picked by the ExternalComponentsGenerator
            FileUtils.copyFile(
                iconName, File(
                    File(
                        externalComponents,
                        compiler.packageName
                    ).toString() + File.separator + "aiwebres"
                            + File.separator + iconName.name
                )
            )
            val depsDirectory = File(extensionDirectory, "deps")
            if (!depsDirectory.mkdir()) {
                println("[ERROR] Failed to create external deps directory")
                return false
            }
            if (!compiler.generateExtensions(
                    filesDir,
                    externalComponents,
                    depsDirectory,
                    classesDir
                )
            ) {
                userErrors.println("Failed to run annotation processors.")
                return false
            }
            println("[INFO] Invoking D8")
            userMessages.println("_______Invoking D8")
            val dexDir = File(extensionDirectory, "dx")
            if (!dexDir.mkdir()) {
                println("[ERROR] Failed to create DX directory")
                return false
            }
            if (!compiler.runD8(dexDir)) {
                userErrors.println("Failed to invoke D8 Dexer.")
                return false
            }
            println("[INFO] Packing Extension Files")
            userMessages.println("_______Packing Extension Files")
            val extensionsDirectory = File(extensionDirectory, "extensions")
            if (!extensionsDirectory.mkdir()) {
                println("[ERROR] Failed to create extensions directory")
                return false
            }
            val outputDirectory = File(extensionDirectory, "out")
            if (!outputDirectory.mkdir()) {
                println("[ERROR] Failed to create output directory")
                return false
            }
            if (!compiler.packExtension(
                    extensionsDirectory, outputDirectory, externalComponents, dexDir, filesDir
                )
            ) {
                userErrors.println("Failed to pack extension.")
                return false
            }
            val time = ((System.currentTimeMillis() - start) / 1000.0).roundToInt()
            println("[INFO] Finished Compilation in $time sec")
            userMessages.println("Compilation Succeeded")
            return true
        }

        fun getXMLString(
            node: Node, withoutNamespaces: Boolean, buff: StringBuffer,
            _endTag: Boolean
        ) {
            var endTag = _endTag
            buff.append("<")
                .append(namespace(node.nodeName, withoutNamespaces))
            if (node.hasAttributes()) {
                buff.append(" ")
                val attr = node.attributes
                val attrLenth = attr.length
                for (i in 0 until attrLenth) {
                    val attrItem = attr.item(i)
                    val name = namespace(attrItem.nodeName, withoutNamespaces)
                    val value = attrItem.nodeValue
                    buff.append(name)
                        .append("=")
                        .append("\"")
                        .append(value)
                        .append("\"")
                    if (i < attrLenth - 1) {
                        buff.append(" ")
                    }
                }
            }
            if (node.hasChildNodes()) {
                buff.append(">")
                val children = node.childNodes
                val childrenCount = children.length
                if (childrenCount == 1) {
                    val item = children.item(0)
                    val itemType = item.nodeType.toInt()
                    if (itemType == Node.TEXT_NODE.toInt()) {
                        if (item.nodeValue == null) {
                            buff.append("/>")
                        } else {
                            buff.append(item.nodeValue)
                            buff.append("</")
                                .append(namespace(node.nodeName, withoutNamespaces))
                                .append(">")
                        }
                        endTag = false
                    }
                }
                for (i in 0 until childrenCount) {
                    val item = children.item(i)
                    val itemType = item.nodeType.toInt()
                    if (itemType == Node.DOCUMENT_NODE.toInt() || itemType == Node.ELEMENT_NODE.toInt()) {
                        getXMLString(item, withoutNamespaces, buff, endTag)
                    }
                }
            } else {
                if (node.nodeValue == null) {
                    buff.append("/>")
                } else {
                    buff.append(node.nodeValue)
                    buff.append("</")
                        .append(namespace(node.nodeName, withoutNamespaces))
                        .append(">")
                }
                endTag = false
            }
            if (endTag) {
                buff.append("</")
                    .append(namespace(node.nodeName, withoutNamespaces))
                    .append(">")
            }
        }

        private fun namespace(str: String, withoutNamespace: Boolean): String {
            return if (withoutNamespace && str.contains(":")) {
                str.substring(str.indexOf(":") + 1)
            } else str
        }
    }

}

internal class JavaSource(name: String?, private val code: String) : SimpleJavaFileObject(
    URI.create(
        "string:///" + (name?.replace(
            '.',
            '/'
        )) + JavaFileObject.Kind.SOURCE.extension
    ), JavaFileObject.Kind.SOURCE
) {
    override fun getCharContent(ignoreEncodingErrors: Boolean): CharSequence {
        return code
    }
}