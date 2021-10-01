package io.mohamed.buildserver;

import java.io.File;

public class Result {

  private final boolean successful;
  private File outputExtension;

  public Result(boolean successful, File outputExtension) {
    this.successful = successful;
    this.outputExtension = outputExtension;
  }

  public Result(boolean successful) {
    this.successful = successful;
  }

  public boolean isSuccessful() {
    return successful;
  }

  public File getOutputExtension() {
    return outputExtension;
  }
}
