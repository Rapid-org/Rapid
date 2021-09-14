package io.mohamed.buildserver;

import java.io.File;
import java.io.InputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Enumeration;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import me.vilsol.blockly2java.Blockly2Java;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.springframework.web.multipart.MultipartFile;

public class ExtensionBuilder {

  public ExtensionBuilder() {}

  public Result build(MultipartFile inputFile, PrintWriter userErrors, PrintWriter userMessages) {
    try {
      File input = new File(inputFile.getName());
      FileUtils.writeByteArrayToFile(input, inputFile.getBytes());
      ZipFile file = new ZipFile(input);
      ZipEntry extensionProperties = getEntryByPath("extension.json", file);
      if (extensionProperties == null) {
        System.out.println("[ERROR] No extension properties file found in the given project file.");
        userErrors.println("Invalid extension project file! No extension properties file found.");
        return new Result(false);
      }
      InputStream inputStream = file.getInputStream(extensionProperties);
      // read extension.json file
      JSONObject extensionPropertiesObject = new JSONObject(new String(
          IOUtils.toByteArray(inputStream)));
      String projectName = extensionPropertiesObject.getString("name");
      if (projectName == null || projectName.isEmpty()) {
        System.out.println("[ERROR] Failed to resolve name for project file.");
        userErrors.println("Invalid extension properties file! No project name specified.");
        return new Result(false);
      }
      String packageName = extensionPropertiesObject.getString("packageName");
      if (packageName == null || packageName.isEmpty()) {
        System.out.println("[ERROR] Failed to resolve packageName for project file.");
        userErrors.println("Invalid extension properties file! No package name specified.");
        return new Result(false);
      }
      ZipEntry sourceFile = getEntryByPath("src/main/java/" + packageName
          .replaceAll("\\.", "/") + "/" + projectName + ".java", file);
      if (sourceFile == null) {
        System.out.println("[ERROR] No source files found in the given project file.");
        userErrors.println("Invalid Project file. No Source Files found.");
        return new Result(false);
      }
      String code = IOUtils.toString(file.getInputStream(sourceFile), StandardCharsets.UTF_8);
      File extensionDir = Files.createTempDirectory(projectName).toFile();
      boolean success = Compiler.compile(extensionDir, extensionPropertiesObject, code, userErrors, userMessages);
      File outputExtension = new File(new File(extensionDir, "out"), packageName + ".aix");
      if (!outputExtension.exists()) {
        System.out.println("[ERROR] Failed to find generated extension.");
        userErrors.println("Generated extension doesn't exist.");
        return new Result(false);
      }
      return new Result(success, outputExtension);
    } catch (Exception e) {
      e.printStackTrace();
      return new Result(false);
    }
  }

  private ZipEntry getEntryByPath(String path, ZipFile zipFile) {
    Enumeration<? extends ZipEntry> entries = zipFile.entries();
    while (entries.hasMoreElements()) {
      ZipEntry entry = entries.nextElement();
      if (entry.getName().equals(path)) {
        return entry;
      }
    }
    return null;
  }
}
