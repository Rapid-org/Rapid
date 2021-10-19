package io.mohamed.rapid.buildserver

import org.json.JSONObject
import org.springframework.core.io.InputStreamResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.io.*
import java.util.*
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

@RestController
@CrossOrigin(origins = ["*"])
class BuildServerController {
    @RequestMapping(value = ["/build"], method = [RequestMethod.POST])
    fun build(@RequestParam("input") inputFile: MultipartFile): ResponseEntity<String> {
        val builder = ExtensionBuilder()
        val errors = ByteArrayOutputStream()
        val errorWriter = PrintWriter(errors, true)
        val messages = ByteArrayOutputStream()
        val messagesWriter = PrintWriter(messages, true)
        val result = builder.build(inputFile, errorWriter, messagesWriter)
        if (result.isSuccessful && result.outputExtension == null) {
            println(
                "[ERROR] Fatal Error: Extension compiled successfully,"
                        + " but not extension file was found. Aborting"
            )
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                "Extension compiled successfully, "
                        + "but no extension file was found."
            )
        }
        try {
            errors.close()
        } catch (e: IOException) {
            e.printStackTrace()
        }
        return try {
            val outputObject = JSONObject()
            outputObject.put("success", result.isSuccessful)
            outputObject.put("messages", messages.toString("UTF-8"))
            outputObject.put("errors", errors.toString("UTF-8"))
            if (result.isSuccessful) {
                val uuid = UUID.randomUUID().toString()
                val file = ExtensionFile(result.outputExtension, uuid)
                val downloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/ext/")
                    .path(file.id!!)
                    .toUriString()
                val executorService = Executors.newSingleThreadScheduledExecutor()
                val task = executorService.schedule(
                    Callable {
                        file.file?.delete() // delete the generated extension.
                        cacheNames.remove(file)
                        file
                    }, 10, TimeUnit.MINUTES
                )
                cacheNames[file] = task
                outputObject.put("downloadUrl", downloadUri)
            } else {
                outputObject.put("downloadUrl", "")
            }
            ResponseEntity.ok(outputObject.toString())
        } catch (e: UnsupportedEncodingException) {
            // Should never happen.
            ResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @RequestMapping(value = ["/ext/{fileId}"], method = [RequestMethod.GET])
    fun downloadExtension(@PathVariable fileId: String): ResponseEntity<*> {
        for (entry in cacheNames.entries) {
            val key = entry.key
            if (key.id == fileId) {
                if (key.file != null) {
                    try {
                        val resource: Resource = InputStreamResource(
                            FileInputStream(
                                key.file
                            )
                        )
                        return ResponseEntity.ok()
                            .contentLength(key.file.length())
                            .contentType(MediaType.parseMediaType("application/java-archive"))
                            .header(
                                "Content-Disposition",
                                "attachment; filename=\"" + key.file.name + "\""
                            )
                            .body(resource)
                    } catch (e: IOException) {
                        e.printStackTrace()
                    }
                }
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Not Found\"}")
    }

    companion object {
        private val cacheNames: MutableMap<ExtensionFile, ScheduledFuture<ExtensionFile>> =
            HashMap()
    }
}