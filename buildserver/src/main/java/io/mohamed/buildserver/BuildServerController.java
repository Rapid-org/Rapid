package io.mohamed.buildserver;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import javax.print.attribute.standard.Media;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@CrossOrigin(origins = "*")
public class BuildServerController {
  private static final Map<ExtensionFile, ScheduledFuture<ExtensionFile>> cacheNames = new HashMap<>();

  @RequestMapping(value = "/build", method = RequestMethod.POST)
  public ResponseEntity<String> build(@RequestParam("input") MultipartFile inputFile) {
    ExtensionBuilder builder = new ExtensionBuilder();
    ByteArrayOutputStream errors = new ByteArrayOutputStream();
    PrintWriter errorWriter = new PrintWriter(errors, true);
    ByteArrayOutputStream messages = new ByteArrayOutputStream();
    PrintWriter messagesWriter = new PrintWriter(messages, true);
    Result result = builder.build(inputFile, errorWriter, messagesWriter);
    if (result.isSuccessful() && result.getOutputExtension() == null) {
      System.out.println("[ERROR] Fatal Error: Extension compiled successfully,"
          + " but not extension file was found. Aborting");
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Extension compiled successfully, "
          + "but not extension file was found.");
    }
    try {
      errors.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
    try {
      JSONObject outputObject = new JSONObject();
      outputObject.put("success", result.isSuccessful());
      outputObject.put("messages", messages.toString("UTF-8"));
      outputObject.put("errors", errors.toString("UTF-8"));
      if (result.isSuccessful()) {
        ExtensionFile file = new ExtensionFile(result.getOutputExtension(), RandomUtil.unique());
        String downloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/ext/")
            .path(file.getId())
            .toUriString();
        ScheduledExecutorService executorService = Executors.newSingleThreadScheduledExecutor();
        ScheduledFuture<ExtensionFile> task = executorService.schedule(() -> {
          cacheNames.remove(file);
          return file;
        }, 10, TimeUnit.MINUTES);
        cacheNames.put(file, task);
        outputObject.put("downloadUrl", downloadUri);
      } else {
        outputObject.put("downloadUrl", "");
      }
      return ResponseEntity.ok(outputObject.toString());
    } catch (UnsupportedEncodingException e) {
      // Should never happen.
      return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @RequestMapping(value = "/ext/{fileId}", method = RequestMethod.GET)
  public ResponseEntity<?> downloadExtension(@PathVariable String fileId) {
    for (Entry<ExtensionFile, ScheduledFuture<ExtensionFile>> entry : cacheNames.entrySet()) {
      if (entry.getKey().getId().equals(fileId)) {
        if (entry.getKey().getFile() != null) {
          try {
            Resource resource = new InputStreamResource(new FileInputStream(entry.getKey().getFile()));
            return ResponseEntity.ok()
                .contentLength(entry.getKey().getFile().length())
                .contentType(MediaType.parseMediaType("application/java-archive"))
                .header("Content-Disposition", "attachment; filename=\"" + entry.getKey().getFile().getName() + "\"")
                .body(resource);
          } catch (IOException e) {
            e.printStackTrace();
          }
        }
      }
    }
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not Found");
  }
}
