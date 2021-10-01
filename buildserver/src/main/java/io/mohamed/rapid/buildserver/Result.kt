package io.mohamed.rapid.buildserver

import java.io.File

class Result {
    val isSuccessful: Boolean
    var outputExtension: File? = null
        private set

    constructor(successful: Boolean, outputExtension: File?) {
        isSuccessful = successful
        this.outputExtension = outputExtension
    }

    constructor(successful: Boolean) {
        isSuccessful = successful
    }
}