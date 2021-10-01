package io.mohamed.buildserver;

import java.io.File;

public class ExtensionFile {

  private final File file;
  private final String id;

  public ExtensionFile(File file, String id) {
    this.file = file;
    this.id = id;
  }

  public String getId() {
    return id;
  }

  public File getFile() {
    return file;
  }
}
