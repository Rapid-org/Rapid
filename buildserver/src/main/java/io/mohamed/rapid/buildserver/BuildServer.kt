package io.mohamed.rapid.buildserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
open class BuildServer {

    companion object {
        @JvmStatic fun main(args: Array<String>) {
            runApplication<BuildServer>(*args)
        }
    }
}