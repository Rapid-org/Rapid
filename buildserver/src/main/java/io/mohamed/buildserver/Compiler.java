package io.mohamed.buildserver;

import com.android.tools.r8.CompilationFailedException;
import com.android.tools.r8.D8;
import com.android.tools.r8.D8Command;
import com.android.tools.r8.R8;
import com.android.tools.r8.R8Command;
import com.android.tools.r8.origin.Origin;
import com.google.appinventor.components.scripts.ComponentDescriptorGenerator;
import com.google.appinventor.components.scripts.ComponentListGenerator;
import com.google.appinventor.components.scripts.ComponentTranslationGenerator;
import com.google.appinventor.components.scripts.ExternalComponentGenerator;
import com.google.appinventor.components.scripts.MarkdownDocumentationGenerator;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
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
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.zeroturnaround.zip.ZipUtil;

public class Compiler {

  private final PrintWriter userErrors;
  private final ArrayList<String> generatedClasses = new ArrayList<>();
  private final String packageName;
  private final String code;
  private final String androidManifestXml;
  private String projectName;
  private boolean proguard;

  private Compiler(JSONObject propertiesObj, String code, PrintWriter userErrors,
      String androidManifestXml) {
    this.userErrors = userErrors;
    this.code = code;
    this.packageName = propertiesObj.getString("packageName");
    this.androidManifestXml = androidManifestXml;
  }

  public static boolean compile(
      File extensionDirectory,
      JSONObject propertiesObj,
      String code,
      String androidManifestXml,
      PrintWriter userErrors,
      PrintWriter userMessages) throws ParserConfigurationException, IOException, SAXException {
    Compiler compiler = new Compiler(propertiesObj, code, userErrors, androidManifestXml);
    compiler.projectName = propertiesObj.getString("name");
    compiler.proguard = propertiesObj.getBoolean("proguard");
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
    if (!compiler.parseAndroidManifest(classesDir)) {

    }
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
    if (compiler.proguard) {
      System.out.println("[INFO] Invoking R8..");
      userMessages.println("_______Proguarding Source Files..");
      if (!compiler.proguardSourceFiles(filesDir)) {
        userErrors.println("Failed to proguard extensions.");
        return false;
      }
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

  public static void getXMLString(Node node, boolean withoutNamespaces, StringBuffer buff,
      boolean endTag) {
    buff.append("<")
        .append(namespace(node.getNodeName(), withoutNamespaces));

    if (node.hasAttributes()) {
      buff.append(" ");

      NamedNodeMap attr = node.getAttributes();
      int attrLenth = attr.getLength();
      for (int i = 0; i < attrLenth; i++) {
        Node attrItem = attr.item(i);
        String name = namespace(attrItem.getNodeName(), withoutNamespaces);
        String value = attrItem.getNodeValue();

        buff.append(name)
            .append("=")
            .append("\"")
            .append(value)
            .append("\"");

        if (i < attrLenth - 1) {
          buff.append(" ");
        }
      }
    }

    if (node.hasChildNodes()) {
      buff.append(">");

      NodeList children = node.getChildNodes();
      int childrenCount = children.getLength();

      if (childrenCount == 1) {
        Node item = children.item(0);
        int itemType = item.getNodeType();
        if (itemType == Node.TEXT_NODE) {
          if (item.getNodeValue() == null) {
            buff.append("/>");
          } else {
            buff.append(item.getNodeValue());
            buff.append("</")
                .append(namespace(node.getNodeName(), withoutNamespaces))
                .append(">");
          }

          endTag = false;
        }
      }

      for (int i = 0; i < childrenCount; i++) {
        Node item = children.item(i);
        int itemType = item.getNodeType();
        if (itemType == Node.DOCUMENT_NODE || itemType == Node.ELEMENT_NODE) {
          getXMLString(item, withoutNamespaces, buff, endTag);
        }
      }
    } else {
      if (node.getNodeValue() == null) {
        buff.append("/>");
      } else {
        buff.append(node.getNodeValue());
        buff.append("</")
            .append(namespace(node.getNodeName(), withoutNamespaces))
            .append(">");
      }

      endTag = false;
    }

    if (endTag) {
      buff.append("</")
          .append(namespace(node.getNodeName(), withoutNamespaces))
          .append(">");
    }
  }

  private static String namespace(String str, boolean withoutNamespace) {
    if (withoutNamespace && str.contains(":")) {
      return str.substring(str.indexOf(":") + 1);
    }

    return str;
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

  private boolean proguardSourceFiles(File filesDirectory) {
    try {
      File outJar = new File(filesDirectory, "AndroidRuntime_p.jar");
      File inJar = new File(filesDirectory, "AndroidRuntime.jar");
      String configuration =
          "-verbose\n"
              + "-dontwarn\n"
              + "-dontnote **\n"
              + "-optimizationpasses 3\n"
              + "-allowaccessmodification\n"
              + "-dontskipnonpubliclibraryclasses\n"
              + "-mergeinterfacesaggressively\n"
              + "-overloadaggressively\n"
              + "-useuniqueclassmembernames\n"
              + "-repackageclasses ''\n"
              + "\n"
              + "-keep public class * {\n"
              + "    public protected *;\n"
              + "}";
      String[] configurationLines = configuration.split("\n");
      File proguardFile = new File(filesDirectory, "proguard.cfg");
      Files.write(proguardFile.toPath(), Arrays.asList(configurationLines));
      R8.run(
          R8Command.parse(
              new String[]{
                  "--release",
                  "--classfile",
                  "--output",
                  outJar.getAbsolutePath(),
                  "--pg-conf",
                  proguardFile.getAbsolutePath(),
                  inJar.getAbsolutePath()
              },
              Origin.root())
              .build());
      inJar.delete();
      outJar.renameTo(inJar);
      return true;
    } catch (Exception e) {
      StringWriter sw = new StringWriter();
      PrintWriter pw = new PrintWriter(sw);
      e.printStackTrace(pw);
      userErrors.println(sw);
      return false;
    }
  }

  private boolean parseAndroidManifest(File classesDir)
      throws ParserConfigurationException, IOException, SAXException {
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setValidating(false);
    DocumentBuilder builder = factory.newDocumentBuilder();
    InputSource is = new InputSource(new StringReader(androidManifestXml));
    System.out.println(androidManifestXml);
    Document document = builder.parse(is);
    Element rootElement = document.getDocumentElement();
    JSONArray activitiesArray = getActivities(rootElement);
    JSONArray receiversArray = getReceivers(rootElement);
    JSONArray providersArray = getProviders(rootElement);
    JSONArray servicesArray = getServices(rootElement);
    JSONArray permissionsArray = getPermissions(rootElement);
    System.out.println(permissionsArray);
    File simpleComponentsBuildInfoFile =
        new File(classesDir.getAbsolutePath(), "simple_components_build_info.json");
    String buildInfoJsonString = IOUtils
        .toString(new FileInputStream(simpleComponentsBuildInfoFile), StandardCharsets.UTF_8);
    System.out.println(buildInfoJsonString);
    JSONArray buildInfoJsonArray = new JSONArray(buildInfoJsonString);
    JSONObject buildInfoJsonObject = buildInfoJsonArray.getJSONObject(0);
    buildInfoJsonObject.put("activities", activitiesArray);
    buildInfoJsonObject.put("contentProviders", providersArray);
    buildInfoJsonObject.put("broadcastReceivers", receiversArray);
    buildInfoJsonObject.put("services", servicesArray);
    buildInfoJsonObject.put("permissions", permissionsArray);
    buildInfoJsonArray.put(buildInfoJsonObject);
    FileWriter writer = new FileWriter(simpleComponentsBuildInfoFile);
    writer.write(buildInfoJsonArray.toString());
    writer.close();
    return true;
  }

  private JSONArray getActivities(Element rootElement) {
    JSONArray array = new JSONArray();
    NodeList activitiesNodes = rootElement.getElementsByTagName("activity");
    StringBuffer buffer;
    for (int i = 0; i < activitiesNodes.getLength(); i++) {
      Node permissionNode = activitiesNodes.item(i);
      buffer = new StringBuffer();
      getXMLString(permissionNode, true, buffer, true);
      array.put(buffer.toString());
    }
    return array;
  }

  private JSONArray getReceivers(Element rootElement) {
    JSONArray array = new JSONArray();
    NodeList nodes = rootElement.getElementsByTagName("receiver");
    StringBuffer buffer;
    for (int i = 0; i < nodes.getLength(); i++) {
      Node permissionNode = nodes.item(i);
      buffer = new StringBuffer();
      getXMLString(permissionNode, true, buffer, true);
      array.put(buffer.toString());
    }
    return array;
  }

  private JSONArray getProviders(Element rootElement) {
    JSONArray array = new JSONArray();
    NodeList providerNodes = rootElement.getElementsByTagName("provider");
    StringBuffer buffer;
    for (int i = 0; i < providerNodes.getLength(); i++) {
      Node permissionNode = providerNodes.item(i);
      buffer = new StringBuffer();
      getXMLString(permissionNode, true, buffer, true);
      array.put(buffer.toString());
    }
    return array;
  }

  private JSONArray getServices(Element rootElement) {
    JSONArray array = new JSONArray();
    NodeList serviceNodes = rootElement.getElementsByTagName("service");
    StringBuffer buffer;
    for (int i = 0; i < serviceNodes.getLength(); i++) {
      Node permissionNode = serviceNodes.item(i);
      buffer = new StringBuffer();
      getXMLString(permissionNode, true, buffer, true);
      array.put(buffer.toString());
    }
    return array;
  }

  private JSONArray getPermissions(Element rootElement) {
    JSONArray array = new JSONArray();
    NodeList permissionNodes = rootElement.getElementsByTagName("uses-permission");
    for (int i = 0; i < permissionNodes.getLength(); i++) {
      Node permissionNode = permissionNodes.item(i);
      array.put(permissionNode.getAttributes().getNamedItem("android:name")
          .getNodeValue());
    }
    return array;
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
              new String[]{
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
          new String[]{
              simpleComponentsFile.getAbsolutePath(),
              simpleComponentsBuildInfoFile.getAbsolutePath(),
              externalComponentDirectory.getAbsolutePath(),
              classesDirectory.getAbsolutePath(),
              depsDirectory.getAbsolutePath(),
              filesDirectory.getAbsolutePath(),
              "false"
          });
      return true;
    } catch (Exception e) {
      e.printStackTrace();
      userErrors.println(e);
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
