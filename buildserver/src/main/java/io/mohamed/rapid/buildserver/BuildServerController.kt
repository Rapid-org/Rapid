package io.mohamed.rapid.buildserver

import com.thoughtworks.paranamer.CachingParanamer
import com.thoughtworks.paranamer.Paranamer
import io.github.classgraph.ClassGraph
import io.github.classgraph.ClassInfoList
import org.json.JSONArray
import org.json.JSONObject
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.core.io.InputStreamResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.io.*
import java.lang.reflect.Modifier
import java.util.*
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.stream.Collectors


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

    @EventListener
    fun applicationStartup(event: ApplicationReadyEvent) {
        println("The Rapid Buildserver is running..")
        println("Caching classes..")
        fetchClasses(true)
    }

    @RequestMapping(value = ["/classes"], method = [RequestMethod.POST])
    fun resolveClasses(@RequestBody payload: Map<String, Any>): ResponseEntity<String> {
        val minPageSize = payload["min"]
        val maxPageSize = payload["max"]
        val filter = payload["filter"]
        var classes = JSONArray()
        if (cachedClasses == null || cachedClasses!!.isEmpty()) {
            fetchClasses(false, object : FetchClassesCallback {
                override fun onFetch() {
                    if (maxPageSize != null) {
                        if (minPageSize != null) {
                            classes = loadClasses(maxPageSize, minPageSize, filter)
                        }
                    }
                }
            })
        } else {
            if (minPageSize != null) {
                if (maxPageSize != null) {
                    classes = loadClasses(maxPageSize, minPageSize, filter)
                }
            }
            fetchClasses(true)
        }
        return ResponseEntity.status(HttpStatus.OK).body(classes.toString())
    }

    @RequestMapping(value = ["/class"], method = [RequestMethod.POST])
    fun loadClassInfo(@RequestBody payload: Map<String, Any>): ResponseEntity<String> {
        val className = payload["name"]
        val classz: Class<*> = Class.forName(className as String?)
        /**val classObject = JSONObject()
        classObject.put("name", classz.name)
        classObject.put("package", classz.`package`.name)
        classObject.put("simpleName", classz.simpleName)
        val constructors = classz.constructors
        val constructorsArray = JSONArray()
        for (constructor in constructors) {
            val constructorObject = JSONObject()
            val params = constructor.parameters
            val paramsArray = JSONArray()
            for (param in params) {
                val paramObject = JSONObject()
                paramObject.put("name", param.name)
                paramObject.put("type", param.type)
                paramsArray.put(paramObject)
            }
            constructorObject.put("parameters", paramsArray)
            constructorsArray.put(constructorObject)
        }
        val methodsArray = JSONArray()
        val methods = classz.methods
        for (method in methods) {
            val methodObject = JSONObject()
            methodObject.put("name", method.name)
            methodObject.put("returnType", method.returnType.name)
            methodObject.put("isStatic", Modifier.isStatic(method.modifiers))
            val paramsArray = JSONArray()
            val paranamer: Paranamer = CachingParanamer()
            val paramNames: Array<out String>? = paranamer.lookupParameterNames(method)
            println(Arrays.toString(paramNames))
            println(method.name)
            for (param in method.parameters) {
                val paramObject = JSONObject()
                if (paramNames != null) {
                    println(method.parameters.indexOf(param))
                    println(paramNames.size)
                    if (paramNames.size > method.parameters.indexOf(param)) {
                        paramObject.put("name", paramNames[method.parameters.indexOf(param)])
                    } else {
                        paramObject.put("name", param.name)
                    }
                }
                paramObject.put("type", param.type.name)
                paramsArray.put(paramObject)
            }
            methodObject.put("parameters", paramsArray)
            methodsArray.put(methodObject)
        }
        classObject.put("methods", methodsArray)
        classObject.put("constructors", constructorsArray)*/
        val classObject: JSONObject = DocumentationGenerator.generateDocs(className);
        return ResponseEntity.ok(classObject.toString())
    }

    fun loadClasses(maxPageSize: Any, minPageSize: Any, filter: Any?): JSONArray {
        val classes = JSONArray()
        val localCachedClasses: ClassInfoList? = if (filter != null) {
            cachedClasses?.filter { e -> e.name.contains(filter as String)}!!
        } else {
            cachedClasses
        }
        var limitedScanResult =
            localCachedClasses?.stream()
                ?.filter { e -> !e.isInnerClass && !e.isAnnotation && !e.isRecord }
                ?.limit(
                    Integer.parseInt(
                        maxPageSize as String?
                    ).toLong()
                )?.collect(Collectors.toList())
        if (localCachedClasses != null) {
            if (limitedScanResult != null) {
                if (minPageSize.toString().toInt() < limitedScanResult.size) {
                    limitedScanResult = (minPageSize as String?)?.let {
                        limitedScanResult?.let { it1 ->
                            limitedScanResult!!.subList(
                                it.toInt(),
                                it1.size
                            )
                        }
                    }
                }
            }
        }
        if (limitedScanResult != null) {
            for (routeClassInfo in limitedScanResult) {
                val classObject = JSONObject()
                classObject.put(
                    "type",
                    if (routeClassInfo.isEnum) "enum" else if (routeClassInfo.isInterface) "interface" else "class"
                )
                classObject.put("name", routeClassInfo.name)
                classObject.put("package", routeClassInfo.packageName)
                classObject.put("simpleName", routeClassInfo.simpleName)
                classes.put(classObject)
            }
        }
        return classes
    }

    private fun fetchClasses(async: Boolean, callback: FetchClassesCallback? = null) {
        if (!async) {
            ClassGraph()
                .enableClassInfo()
                .scan().use { scanResult ->                // Start the scan
                    println("Finished Synchronous fetching..")
                    println(scanResult.allClasses.size)
                    cachedClasses = scanResult.allClasses
                    callback?.onFetch()
                }
        } else {
            Thread { fetchClasses(false) }.start()
        }
    }

    companion object {
        private val cacheNames: MutableMap<ExtensionFile, ScheduledFuture<ExtensionFile>> =
            HashMap()
        var cachedClasses: ClassInfoList? = null
    }

    interface FetchClassesCallback {
        fun onFetch()
    }
}