package io.mohamed.rapid.buildserver

import org.apache.commons.io.FileUtils
import org.apache.commons.io.IOUtils
import org.json.JSONObject
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.FileOutputStream
import java.io.PrintWriter
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.util.zip.ZipEntry
import java.util.zip.ZipFile

class ExtensionBuilder {
    fun build(
        inputFile: MultipartFile,
        userErrors: PrintWriter,
        userMessages: PrintWriter
    ): Result {
        return try {
            val input = File(inputFile.name)
            FileUtils.writeByteArrayToFile(input, inputFile.bytes)
            val file = ZipFile(input)
            val extensionProperties = getEntryByPath("extension.json", file)
            if (extensionProperties == null) {
                println("[ERROR] No extension properties file found in the given project file.")
                userErrors.println("Invalid extension project file! No extension properties file found.")
                return Result(false)
            }
            val inputStream = file.getInputStream(extensionProperties)
            // read extension.json file
            val extensionPropertiesObject = JSONObject(
                String(
                    IOUtils.toByteArray(inputStream)
                )
            )
            val projectName = extensionPropertiesObject.getString("name")
            if (projectName == null || projectName.isEmpty()) {
                println("[ERROR] Failed to resolve name for project file.")
                userErrors.println("Invalid extension properties file! No project name specified.")
                return Result(false)
            }
            val packageName = extensionPropertiesObject.getString("packageName")
            if (packageName == null || packageName.isEmpty()) {
                println("[ERROR] Failed to resolve packageName for project file.")
                userErrors.println("Invalid extension properties file! No package name specified.")
                return Result(false)
            }
            val iconName = extensionPropertiesObject.getString("icon")
            if (iconName == null || iconName.isEmpty()) {
                println("[ERROR] Failed to resolve iconName for project file.")
                userErrors.println("Invalid extension properties file! No icon name specified.")
                return Result(false)
            }
            val sourceFile = getEntryByPath(
                "src/main/java/" + packageName
                    .replace("\\.".toRegex(), "/") + "/" + projectName + ".java", file
            )
            if (sourceFile == null) {
                println("[ERROR] No source files found in the given project file.")
                userErrors.println("Invalid Project file. No Source Files found.")
                return Result(false)
            }
            val androidManifestXmlFile = getEntryByPath("AndroidManifest.xml", file)
            if (androidManifestXmlFile == null) {
                println("[ERROR] No AndroidManifest file found in the given project file.")
                userErrors.println("Invalid Project file. No android manifest Files found.")
                return Result(false)
            }
            val code = IOUtils.toString(file.getInputStream(sourceFile), StandardCharsets.UTF_8)
            val androidManifestXml = IOUtils
                .toString(file.getInputStream(androidManifestXmlFile), StandardCharsets.UTF_8)
            val extensionDir = Files.createTempDirectory(projectName).toFile()
            val iconFile = File(extensionDir, iconName)
            iconFile.parentFile.mkdirs()
            println(iconFile)
            FileOutputStream(iconFile).use { fos ->
                val entry = getEntryByPath(iconName, file)
                if (entry != null) {
                    IOUtils.copy(file.getInputStream(entry), fos)
                }
            }
            val success: Boolean = Compiler.compile(
                extensionDir, extensionPropertiesObject, code, androidManifestXml, userErrors,
                userMessages, iconFile
            )
            val outputExtension = File(File(extensionDir, "out"), "$packageName.aix")
            if (success && !outputExtension.exists()) { // unexpected to happen
                println("[ERROR] Failed to find generated extension.")
                userErrors.println("Generated extension doesn't exist.")
                return Result(false)
            }
            Result(success, outputExtension)
        } catch (e: Exception) {
            e.printStackTrace()
            Result(false)
        }
    }

    private fun getEntryByPath(path: String, zipFile: ZipFile): ZipEntry? {
        val entries = zipFile.entries()
        while (entries.hasMoreElements()) {
            val entry = entries.nextElement()
            if (entry.name == path) {
                return entry
            }
        }
        return null
    }
}