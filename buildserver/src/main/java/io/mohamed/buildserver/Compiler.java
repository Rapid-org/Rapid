package io.mohamed.buildserver;

import com.android.tools.r8.CompilationFailedException;
import com.android.tools.r8.D8;
import com.android.tools.r8.D8Command;
import com.android.tools.r8.origin.Origin;
import com.google.appinventor.components.scripts.ComponentDescriptorGenerator;
import com.google.appinventor.components.scripts.ComponentListGenerator;
import com.google.appinventor.components.scripts.ComponentTranslationGenerator;
import com.google.appinventor.components.scripts.ExternalComponentGenerator;
import com.google.appinventor.components.scripts.MarkdownDocumentationGenerator;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.jar.Attributes;
import java.util.jar.JarOutputStream;
import java.util.jar.Manifest;
import java.util.zip.ZipEntry;
import javax.tools.Diagnostic;
import javax.tools.Diagnostic.Kind;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaCompiler.CompilationTask;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.zeroturnaround.zip.ZipUtil;

public class Compiler {

  private final PrintWriter userErrors;
  private final ArrayList<String> generatedClasses = new ArrayList<>();
  private final String packageName;
  private final String code;
  private String projectName;

  private Compiler(
      JSONObject propertiesObj, String code, PrintWriter userErrors) {
    this.userErrors = userErrors;
    this.code = code;
    this.packageName = propertiesObj.getString("packageName");
  }

  public static boolean compile(
      File extensionDirectory,
      JSONObject propertiesObj,
      String code,
      PrintWriter userErrors,
      PrintWriter userMessages) {
    Compiler compiler = new Compiler(propertiesObj, code, userErrors);
    compiler.projectName = propertiesObj.getString("name");
    if (compiler.projectName == null) {
      userErrors.println("Invalid extension properties file.");
      System.out.println("[ERROR] Invalid extension properties file.");
      return false;
    }
    long start = System.currentTimeMillis();
    System.out.println("[INFO] Building " + compiler.projectName);
    userMessages.println("Building " + compiler.projectName);
    System.out.println("[INFO] Compiling Source Files..");
    userMessages.println("_______Compiling Project Source Files..");
    File classesDir = new File(extensionDirectory, "classes");
    if (!classesDir.mkdir()) {
      System.out.println("[ERROR] Failed to create classes directory");
      return false;
    }
    if (!compiler.compileSourceFiles(classesDir)) {
      System.out.println("[ERROR] Compile source files failed.");
      userErrors.println("Failed to compile project source.");
      return false;
    }
    compiler.findGeneratedClasses(classesDir);
    System.out.println("[INFO] Creating JAR file for Extension");
    userMessages.println("_______Creating JAR file for Project");
    File filesDir = new File(extensionDirectory, "files");
    if (!filesDir.mkdir()) {
      System.out.println("[ERROR] Failed to create files directory");
      return false;
    }
    if (!compiler.jarExtension(classesDir, filesDir)) {
      userErrors.println("Failed to jar extensions.");
      return false;
    }
    System.out.println("[INFO] Generating Extensions");
    userMessages.println("_______Generating Extensions");
    File externalComponents = new File(extensionDirectory, "externalComponents");
    if (!externalComponents.mkdir()) {
      System.out.println("[ERROR] Failed to create external components directory");
      return false;
    }
    File depsDirectory = new File(extensionDirectory, "deps");
    if (!depsDirectory.mkdir()) {
      System.out.println("[ERROR] Failed to create external deps directory");
      return false;
    }
    if (!compiler.generateExtensions(filesDir, externalComponents, depsDirectory, classesDir)) {
      userErrors.println("Failed to run annotation processors.");
      return false;
    }
    System.out.println("[INFO] Invoking D8");
    userMessages.println("_______Invoking D8");
    File dexDir = new File(extensionDirectory, "dx");
    if (!dexDir.mkdir()) {
      System.out.println("[ERROR] Failed to create DX directory");
      return false;
    }
    if (!compiler.runD8(dexDir)) {
      userErrors.println("Failed to invoke D8 Dexer.");
      return false;
    }
    System.out.println("[INFO] Packing Extension Files");
    userMessages.println("_______Packing Extension Files");
    File extensionsDirectory = new File(extensionDirectory, "extensions");
    if (!extensionsDirectory.mkdir()) {
      System.out.println("[ERROR] Failed to create extensions directory");
      return false;
    }
    File outputDirectory = new File(extensionDirectory, "out");
    if (!outputDirectory.mkdir()) {
      System.out.println("[ERROR] Failed to create output directory");
      return false;
    }
    if (!compiler.packExtension(
        extensionsDirectory, outputDirectory, externalComponents, dexDir, filesDir)) {
      userErrors.println("Failed to pack extension.");
      return false;
    }
    long time = Math.round((System.currentTimeMillis() - start) / 1000.0);
    System.out.println("[INFO] Finished Compilation in " + time + " sec");
    userMessages.println("Compilation Succeeded");
    return true;
  }

  private boolean compileSourceFiles(File classesDir) {
    try {
      JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
      DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
      JavaFileObject file = new JavaSource(projectName, code);
      Iterable<? extends JavaFileObject> compilationUnits = Collections.singletonList(file);
      List<String> options =
          new ArrayList<>(
              Arrays.asList(
                  "-classpath",
                  System.getProperty("java.class.path"),
                  "-target",
                  "1.7",
                  "-source",
                  "1.7",
                  "-d",
                  classesDir.getAbsolutePath()));
      CompilationTask task =
          compiler.getTask(null, null, diagnostics, options, null, compilationUnits);
      task.setProcessors(
          Arrays.asList(
              new ComponentDescriptorGenerator(),
              new ComponentListGenerator(),
              new ComponentTranslationGenerator(),
              new MarkdownDocumentationGenerator()));
      boolean success = task.call();
      for (Diagnostic<? extends JavaFileObject> diagnostic : diagnostics.getDiagnostics()) {
        // TODO: Simplify the errors for a non java user.
        if (diagnostic.getKind() == Kind.ERROR) { // ignore java warnings,
          // they are not useful when dealing with blockly
          userErrors.println(diagnostic); // an error occurred while compiling source files.
        }
      }
      return success;
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
  }

  private boolean packExtension(
      File extensionsDirectory,
      File outputDirectory,
      File externalComponents,
      File dexDirectory,
      File filesDirectory) {
    try {
      File outputPackageDirectory = new File(extensionsDirectory, packageName);
      FileUtils.copyDirectory(externalComponents, extensionsDirectory);
      FileUtils.copyFile(
          new File(dexDirectory, "classes.jar"), new File(outputPackageDirectory, "classes.jar"));
      FileUtils.copyFile(
          new File(filesDirectory, "AndroidRuntime.jar"),
          new File(new File(outputPackageDirectory, "files"), "AndroidRuntime.jar"));
      ZipUtil.pack(extensionsDirectory, new File(outputDirectory, packageName + ".aix"));
      return true;
    } catch (IOException e) {
      e.printStackTrace();
      return false;
    }
  }

  private boolean runD8(File dexDirectory) {
    try {
      File argumentsFile = File.createTempFile("argfile", ".txt");
      ArrayList<String> classes = new ArrayList<>(generatedClasses);
      java.nio.file.Files.write(argumentsFile.toPath(), classes, StandardCharsets.UTF_8);
      D8.run(
          D8Command.parse(
                  new String[] {
                    "--output",
                    new File(dexDirectory, "classes.jar").getAbsolutePath(),
                    "@" + argumentsFile.getAbsolutePath()
                  },
                  Origin.root())
              .build());
      return true;
    } catch (CompilationFailedException | IOException e) {
      e.printStackTrace();
      return false;
    }
  }

  private boolean generateExtensions(
      File filesDirectory,
      File externalComponentDirectory,
      File depsDirectory,
      File classesDirectory) {
    try {
      File simpleComponentsFile =
          new File(classesDirectory.getAbsolutePath(), "simple_components.json");
      File simpleComponentsBuildInfoFile =
          new File(classesDirectory.getAbsolutePath(), "simple_components_build_info.json");
      ExternalComponentGenerator.main(
          new String[] {
            simpleComponentsFile.getAbsolutePath(),
            simpleComponentsBuildInfoFile.getAbsolutePath(),
            externalComponentDirectory.getAbsolutePath(),
            classesDirectory.getAbsolutePath(),
            depsDirectory.getAbsolutePath(),
            filesDirectory.getAbsolutePath(),
            "false"
          });
      return true;
    } catch (IOException e) {
      e.printStackTrace();
      return false;
    }
  }

  private boolean jarExtension(File classesDirectory, File filesDirectory) {
    FileOutputStream fileOutputStream;
    try {
      fileOutputStream = new FileOutputStream(new File(filesDirectory, "AndroidRuntime.jar"));
      Manifest manifest = new Manifest();
      manifest.getMainAttributes().put(Attributes.Name.MANIFEST_VERSION, "1.0");
      JarOutputStream jarOut = new JarOutputStream(fileOutputStream, manifest);
      for (String file : generatedClasses) {
        String relativePath = classesDirectory.toURI().relativize(new File(file).toURI()).getPath();
        jarOut.putNextEntry(new ZipEntry(relativePath));
        jarOut.write(
            IOUtils.toByteArray(new FileInputStream(new File(classesDirectory, relativePath))));
      }
      jarOut.closeEntry();
      jarOut.close();
      fileOutputStream.close();
      return true;
    } catch (IOException e) {
      e.printStackTrace();
      return false;
    }
  }

  private void findGeneratedClasses(File rootDirectory) {
    if (rootDirectory.listFiles() != null) {
      for (File file : Objects.requireNonNull(rootDirectory.listFiles())) {
        if (file.isDirectory()) {
          findGeneratedClasses(file);
        } else if (file.getName()
            .endsWith(".class")) { // collect class files only to dex afterwards
          generatedClasses.add(file.getAbsolutePath());
        }
      }
    }
  }
}

class JavaSource extends SimpleJavaFileObject {

  final String code;

  JavaSource(String name, String code) {
    super(URI.create("string:///" + name.replace('.', '/') + Kind.SOURCE.extension), Kind.SOURCE);
    this.code = code;
  }

  @Override
  public CharSequence getCharContent(boolean ignoreEncodingErrors) {
    return code;
  }
}
